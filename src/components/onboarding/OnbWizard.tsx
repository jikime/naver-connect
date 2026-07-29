"use client";

// OnbWizard — 온보딩 위저드 셸. 7스텝 진행 상태·검증·데이터 패칭을 소유한다.
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a/T-009b, FR-ON-01~11
// 스텝: ①프로필확인 ②수요1~3+★1 ③공급1~3 ④협력성향4문항 ⑤민감정보고지 ⑥AI후속질문 ⑦확정.
// 협업준비도='구체적 프로젝트 있음'→hot_lead(스텝6 후속질문 +3 분기 트리거, FR-ON-05).

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Gift,
  Handshake,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchTypeBadge } from "@/components/shared/MatchTypeBadge";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { Button } from "@/components/ui/button";
import {
  finalizeOnboarding,
  getInterviewScript,
  getMeetups,
  getMember,
  getOnboardingMeta,
  getTags,
} from "@/lib/dal";
import { useAuthSessionStore } from "@/stores/auth-session";
import { useViewerContext } from "@/stores/viewer-context";
import type {
  MaskedMember,
  Meetup,
  OnboardingScriptMeta,
  Recommendation,
  Tag,
} from "@/types";
import { CollaborationTraitsStep } from "./CollaborationTraitsStep";
import { DemandSelectStep } from "./DemandSelectStep";
import {
  FollowupQuestionStep,
  type FollowupQueueItem,
} from "./FollowupQuestionStep";
import {
  createEmptyDraft,
  isHotLead,
  type OnboardingDraft,
  TOTAL_STEPS,
} from "./onboarding-draft";
import { ProfileConfirmStep } from "./ProfileConfirmStep";
import { SensitiveInfoNotice } from "./SensitiveInfoNotice";
import { SupplySelectStep } from "./SupplySelectStep";
import { VisibilityConsent } from "./VisibilityConsent";

interface FinalizeResult {
  member: MaskedMember;
  firstRecommendations: Recommendation[];
}

// Task #21: 스텝 전환 슬라이드(direction: 다음=1 → 오른쪽에서 진입/왼쪽으로 퇴장, 이전=-1 → 반대)
const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
};

const STEP_META = [
  {
    title: "프로필 확인",
    description: "네트워크가 미리 정리한 기본 정보를 확인해요.",
    time: "약 1분",
    icon: UserRound,
  },
  {
    title: "필요한 연결",
    description: "지금 가장 필요한 것을 1~3가지 고르고 우선순위를 알려주세요.",
    time: "약 1분",
    icon: Lock,
  },
  {
    title: "나눌 수 있는 것",
    description: "다른 회원에게 건넬 수 있는 경험을 1~3가지 골라요.",
    time: "약 1분",
    icon: Gift,
  },
  {
    title: "협력 성향",
    description: "관심 활동과 편안한 협업 방식을 맞춰봐요.",
    time: "약 1분",
    icon: Handshake,
  },
  {
    title: "정보 보호 안내",
    description: "솔직한 답변을 지키는 공개 범위를 확인해요.",
    time: "약 30초",
    icon: ShieldCheck,
  },
  {
    title: "한 줄 인터뷰",
    description: "선택한 항목을 추천의 이유가 될 한 문장으로 구체화해요.",
    time: "약 2분",
    icon: MessageCircle,
  },
  {
    title: "프로필 확정",
    description: "공개 정보와 추천용 비공개 정보를 마지막으로 확인해요.",
    time: "약 1분",
    icon: CheckCircle2,
  },
] as const;

function canProceedFromStep(
  step: number,
  draft: OnboardingDraft,
  requiresParticipationScope: boolean,
): boolean {
  switch (step) {
    case 1:
      return (
        draft.orgName.trim().length > 0 &&
        draft.orgType.trim().length > 0 &&
        draft.orgRole.trim().length > 0 &&
        draft.sido.trim().length > 0 &&
        draft.sigungu.trim().length > 0 &&
        draft.fieldTags.length > 0 &&
        draft.valueChainStage.trim().length > 0 &&
        draft.missionStatement.trim().length > 0
      );
    // Codex 합의(2026-07-29): 수요/공급 최소 1 + 최대 3으로 완화, primary 정확히 1개
    case 2:
      return (
        draft.demandSelections.length >= 1 &&
        draft.demandSelections.length <= 3 &&
        draft.demandSelections.filter((s) => s.priority).length === 1
      );
    case 3:
      return (
        draft.supplySelections.length >= 1 &&
        draft.supplySelections.length <= 3 &&
        draft.supplySelections.every((s) => s.detail.trim().length > 0)
      );
    case 4:
      return (
        draft.activities.length > 0 &&
        draft.availability.length > 0 &&
        draft.preferredMode.length > 0 &&
        draft.readiness.length > 0 &&
        (!requiresParticipationScope || draft.participationScope.length > 0)
      );
    case 6:
      return draft.followupDone;
    default:
      return true;
  }
}

export function OnbWizard() {
  const vc = useViewerContext();
  const completeOnboarding = useAuthSessionStore(
    (state) => state.completeOnboarding,
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [scriptMeta, setScriptMeta] = useState<OnboardingScriptMeta | null>(
    null,
  );
  const [sourceMember, setSourceMember] = useState<MaskedMember | null>(null);

  const [step, setStep] = useState(1);
  // Task #21: 스텝 전환 슬라이드 방향(다음=1, 이전=-1) — AnimatePresence의 initial/exit에 사용
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<OnboardingDraft>(createEmptyDraft());
  const [followupQueue, setFollowupQueue] = useState<FollowupQueueItem[]>([]);

  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [result, setResult] = useState<FinalizeResult | null>(null);
  // v1.1 ADR-06: 모둠 변형은 meetup_id로 meetups.json을 참조한다(인라인 meetup 객체 폐지).
  const [meetupsById, setMeetupsById] = useState<Map<string, Meetup>>(
    new Map(),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: vc 객체는 selector가 매 렌더 새로 만들어 원시값(personaId/role)만 추적한다
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      setResult(null);
      setStep(1);
      setFollowupQueue([]);
      try {
        const [tagsRes, memberRes, metaRes] = await Promise.all([
          getTags(),
          getMember(vc, vc.personaId),
          getOnboardingMeta(),
        ]);
        if (cancelled) return;
        setTags(tagsRes);
        setScriptMeta(metaRes);
        setSourceMember(memberRes);
        setDraft({
          ...createEmptyDraft(),
          orgName: memberRes.org.name,
          orgType: memberRes.org.type,
          orgRole: memberRes.org.role,
          sido: memberRes.region.sido,
          sigungu: memberRes.region.sigungu,
          fieldTags: memberRes.field_tags,
          valueChainStage: memberRes.value_chain_stage,
          missionStatement: memberRes.mission_statement,
          trustConnections: memberRes.trust_connections.map(
            (connection, index) => ({
              ...connection,
              draftId: `${memberRes.id}-trust-${index}`,
            }),
          ),
          supplySelections:
            memberRes.member_type === "전문가"
              ? memberRes.visibility.public.supply_tags.slice(0, 3)
              : [],
        });
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error
              ? e.message
              : "프로필을 불러오지 못했어요. 역할 스위처에서 기업가 또는 전문가 페르소나를 선택해주세요.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [vc.personaId, vc.role]);

  function updateDraft(patch: Partial<OnboardingDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  async function handleAcknowledgeNotice() {
    const priority = draft.demandSelections.find((s) => s.priority);
    const otherDemand = draft.demandSelections.find((s) => !s.priority);
    const supply = draft.supplySelections[0];
    const items: FollowupQueueItem[] = [];

    if (priority) {
      const script = await getInterviewScript(priority.tagId);
      const q = script.demand_questions[0];
      if (q) {
        items.push({
          id: `demand-${priority.tagId}`,
          kind: "demand",
          tagId: priority.tagId,
          question: q.text,
          exampleAnswer: q.example_answer,
        });
      }
    }
    if (otherDemand) {
      const script = await getInterviewScript(otherDemand.tagId);
      const q = script.demand_questions[0];
      if (q) {
        items.push({
          id: `demand-${otherDemand.tagId}`,
          kind: "demand",
          tagId: otherDemand.tagId,
          question: q.text,
          exampleAnswer: q.example_answer,
        });
      }
    }
    if (supply) {
      const script = await getInterviewScript(supply.tagId);
      const q = script.supply_questions[0];
      if (q) {
        items.push({
          id: `supply-${supply.tagId}`,
          kind: "supply",
          tagId: supply.tagId,
          question: q.text,
          exampleAnswer: q.example_answer,
        });
      }
    }
    if (isHotLead(draft.readiness) && scriptMeta) {
      for (const [i, q] of scriptMeta.hot_lead_deep_questions.entries()) {
        items.push({ id: `hotlead-${i}`, kind: "hot_lead", question: q });
      }
    }

    setFollowupQueue(items);
    goToStep(6);
  }

  function handleFollowupAnswer(item: FollowupQueueItem, answer: string) {
    updateDraft({
      followupAnswers: [
        ...draft.followupAnswers,
        { kind: item.kind, tagId: item.tagId, question: item.question, answer },
      ],
    });
  }

  async function handleFinalize() {
    setFinalizing(true);
    setFinalizeError(null);
    try {
      const demand_tags = draft.demandSelections.map((sel) => {
        const followup = draft.followupAnswers.find(
          (a) => a.kind === "demand" && a.tagId === sel.tagId,
        );
        // M2 P1-1: 승인 의사만 동봉 — 영수증은 finalize 내부에서 서버가 발급한다.
        const approval = draft.safeMatchApprovals[sel.tagId];
        // P1-3: 질문하지 않은 항목에 시스템 문구를 사용자 원문처럼 넣지 않는다 — 빈 값 유지
        return {
          tagId: sel.tagId,
          priority: sel.priority,
          detail_quote: followup?.answer?.trim() ?? "",
          ...(draft.consentMatching &&
          approval?.approved &&
          approval.text.trim().length > 0
            ? { safe_match: { approved: true, text: approval.text.trim() } }
            : {}),
        };
      });
      const supplyFollowup = draft.followupAnswers.find(
        (a) => a.kind === "supply",
      );
      const supply_tags = draft.supplySelections.map((sel) => ({
        tagId: sel.tagId,
        detail:
          sel.tagId === supplyFollowup?.tagId && supplyFollowup.answer
            ? supplyFollowup.answer
            : sel.detail,
      }));
      const hotLeadAnswers = draft.followupAnswers.filter(
        (a) => a.kind === "hot_lead",
      );
      const hot_lead = isHotLead(draft.readiness)
        ? {
            flag: true,
            project_summary: hotLeadAnswers[0]?.answer ?? "",
            needed_partner: hotLeadAnswers[1]?.answer ?? "",
            stage: hotLeadAnswers[2]?.answer ?? "",
          }
        : null;

      const finalized = await finalizeOnboarding(vc, {
        organization: {
          name: draft.orgName,
          type: draft.orgType,
          role: draft.orgRole,
        },
        region: {
          sido: draft.sido,
          sigungu: draft.sigungu,
        },
        field_tags: [...draft.fieldTags],
        value_chain_stage: draft.valueChainStage,
        mission_statement: draft.missionStatement,
        demand_tags,
        supply_tags,
        activities: draft.activities,
        availability: draft.availability,
        preferred_mode: draft.preferredMode,
        participation_scope: draft.participationScope || null,
        hot_lead,
        // M1 무손실: readiness·trust_connections도 finalize에 전달(소실 수정)
        readiness: draft.readiness,
        trust_connections: draft.trustConnections.map(({ type, ref }) => ({
          type,
          ref,
        })),
        consents: {
          publish_profile: draft.visibilityConsent,
          use_private_needs_for_matching: draft.consentMatching,
          quote_in_intro: draft.consentQuote,
        },
        visibility_consent: draft.visibilityConsent,
      });
      setResult(finalized);
      completeOnboarding();
      if (
        finalized.firstRecommendations.some((rec) => rec.rec_kind === "모둠")
      ) {
        const meetups = await getMeetups(vc);
        setMeetupsById(new Map(meetups.map((m) => [m.id, m])));
      }
    } catch (e) {
      setFinalizeError(
        e instanceof Error ? e.message : "확정 중 문제가 발생했어요.",
      );
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) {
    return (
      <div className="grid animate-pulse gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="h-[32rem] rounded-3xl bg-muted" />
        <div className="h-[40rem] rounded-3xl bg-muted" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-start gap-3 rounded-3xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-foreground">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <p className="font-semibold">온보딩 정보를 불러오지 못했어요.</p>
          <p className="mt-1 text-guud-text-muted-2">{loadError}</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <section className="overflow-hidden rounded-[2rem] border border-guud-hairline bg-card shadow-sm">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col justify-between gap-10 bg-secondary p-7 sm:p-10">
            <div>
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-7" strokeWidth={2.5} />
              </span>
              <p className="mt-7 font-mono text-[0.625rem] font-medium tracking-[0.16em] text-primary uppercase">
                [ ONBOARDING COMPLETE ]
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {result.member.name}님의
                <br />첫 연결이 준비됐어요
              </h2>
              <p className="mt-4 text-sm leading-7 text-guud-text-muted-2">
                정리한 프로필을 기준으로 꼭 만나야 할 회원과 모임을 이유와 함께
                골랐습니다.
              </p>
            </div>
            <div className="rounded-2xl bg-background/75 p-4 text-xs leading-5 text-guud-text-muted-2">
              추천이 맞지 않으면 이유를 알려주세요. 다음 추천을 더 정확하게
              만드는 기준이 됩니다.
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[0.625rem] tracking-[0.16em] text-guud-text-muted-2 uppercase">
                  [ FIRST RECOMMENDATIONS ]
                </p>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-foreground">
                  먼저 살펴볼 연결
                </h3>
              </div>
              <span className="font-heading text-3xl font-semibold text-primary">
                {result.firstRecommendations.length}
              </span>
            </div>

            <ul className="mt-6 space-y-3">
              {result.firstRecommendations.map((rec, index) => (
                <li
                  key={rec.id}
                  className="rounded-2xl border border-guud-hairline bg-background p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-guud-text-faint">
                      0{index + 1}
                    </span>
                    <MatchTypeBadge type={rec.match_type} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground">
                    {rec.rec_kind === "모둠"
                      ? ((rec.meetup_id
                          ? meetupsById.get(rec.meetup_id)?.purpose
                          : undefined) ?? "모둠 추천")
                      : rec.matching_rationale}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/recommendations">
                  추천 자세히 보기 <ArrowRight className="size-4" />
                  <AutomationLevelBadge frId="FR-RC-01" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/profile">완성된 프로필 보기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentMeta = STEP_META[step - 1];
  const CurrentIcon = currentMeta.icon;
  const memberType = sourceMember?.member_type ?? "기업가";
  const requiresParticipationScope =
    sourceMember?.expert_subtype === "공공중간지원";
  const canProceed = canProceedFromStep(
    step,
    draft,
    requiresParticipationScope,
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-guud-hairline bg-card p-5 lg:sticky lg:top-24">
        <div className="flex items-end justify-between border-b border-guud-hairline pb-5">
          <div>
            <p className="font-mono text-[0.625rem] tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ YOUR PROGRESS ]
            </p>
            <p className="mt-2 font-heading text-lg font-semibold text-foreground">
              연결 프로필 만들기
            </p>
          </div>
          <span className="font-heading text-2xl font-semibold text-primary">
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </span>
        </div>

        <ol
          className="mt-5 hidden space-y-1 lg:block"
          aria-label="온보딩 진행 단계"
        >
          {STEP_META.map((item, index) => {
            const stepNumber = index + 1;
            const complete = stepNumber < step;
            const current = stepNumber === step;
            const StepIcon = item.icon;
            return (
              <li
                key={item.title}
                aria-current={current ? "step" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                  current ? "bg-secondary" : ""
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    complete
                      ? "border-primary bg-primary text-primary-foreground"
                      : current
                        ? "border-primary bg-background text-primary"
                        : "border-guud-hairline text-guud-text-faint"
                  }`}
                >
                  {complete ? (
                    <Check className="size-4" />
                  ) : (
                    <StepIcon className="size-3.5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      current || complete
                        ? "text-foreground"
                        : "text-guud-text-muted-2"
                    }`}
                  >
                    {item.title}
                  </p>
                  {current && (
                    <p className="mt-0.5 text-xs text-guud-text-muted-2">
                      {item.time}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <ol
          className="mt-5 grid grid-cols-7 gap-1.5 lg:hidden"
          aria-label="온보딩 진행 단계"
        >
          {STEP_META.map((item, index) => {
            const stepNumber = index + 1;
            const complete = stepNumber < step;
            const current = stepNumber === step;
            return (
              <li
                key={item.title}
                aria-current={current ? "step" : undefined}
                aria-label={`${stepNumber}단계 ${item.title}${current ? ", 현재 단계" : complete ? ", 완료" : ""}`}
                className={`h-2 rounded-full ${
                  complete || current ? "bg-primary" : "bg-muted"
                }`}
              />
            );
          })}
        </ol>

        <div className="mt-5 rounded-2xl bg-foreground p-4 text-background">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck className="size-4 text-primary" /> 솔직한 답변을
            지켜드려요
          </div>
          <p className="mt-2 text-xs leading-5 text-background/60">
            필요한 연결과 프로젝트 고민은 공개 프로필에 표시하지 않습니다.
          </p>
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-3xl border border-guud-hairline bg-card shadow-sm">
        <header className="border-b border-guud-hairline px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
                <CurrentIcon className="size-3.5" /> STEP {step}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-guud-text-muted-2">
                <Clock3 className="size-3.5" /> {currentMeta.time}
              </span>
            </div>
            <span className="font-mono text-xs text-guud-text-muted-2">
              {step} / {TOTAL_STEPS}
            </span>
          </div>
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {currentMeta.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-guud-text-muted-2">
            {currentMeta.description}
          </p>
          <div
            className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </header>

        <div className="min-h-[30rem] px-6 py-7 sm:px-8 sm:py-9">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18 }}
            >
              {step === 1 && (
                <ProfileConfirmStep
                  draft={draft}
                  onChange={updateDraft}
                  mode="edit"
                />
              )}
              {step === 2 && (
                <DemandSelectStep
                  tags={tags}
                  draft={draft}
                  onChange={updateDraft}
                  memberType={memberType}
                />
              )}
              {step === 3 && (
                <SupplySelectStep
                  tags={tags}
                  draft={draft}
                  onChange={updateDraft}
                  memberType={memberType}
                  hasPrefilledValues={
                    memberType === "전문가" &&
                    (sourceMember?.visibility.public.supply_tags.length ?? 0) >
                      0
                  }
                />
              )}
              {step === 4 && (
                <CollaborationTraitsStep
                  draft={draft}
                  onChange={updateDraft}
                  isExpert={memberType === "전문가"}
                  requiresParticipationScope={requiresParticipationScope}
                />
              )}
              {step === 5 && scriptMeta && (
                <SensitiveInfoNotice
                  notice={scriptMeta.sensitive_notice}
                  onAcknowledge={handleAcknowledgeNotice}
                  hasHotLead={isHotLead(draft.readiness)}
                />
              )}
              {step === 6 && (
                <FollowupQuestionStep
                  queue={followupQueue}
                  onAnswer={handleFollowupAnswer}
                  onComplete={() => updateDraft({ followupDone: true })}
                  done={draft.followupDone}
                  isHotLead={isHotLead(draft.readiness)}
                />
              )}
              {step === 7 && (
                <div className="space-y-6">
                  <ProfileConfirmStep
                    draft={draft}
                    onChange={updateDraft}
                    mode="review"
                  />
                  <div className="grid gap-4 xl:grid-cols-2">
                    <section className="rounded-2xl border border-guud-hairline bg-secondary/60 p-5">
                      <div className="flex items-center gap-2">
                        <Eye className="size-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">
                          다른 회원에게 공개
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-guud-text-muted-2">
                        나를 찾고 협업을 제안하는 데 쓰입니다.
                      </p>
                      <ul className="mt-4 space-y-3">
                        {draft.supplySelections.map((selection) => {
                          const tag = tags.find(
                            (item) => item.id === selection.tagId,
                          );
                          return (
                            <li
                              key={selection.tagId}
                              className="rounded-xl bg-background p-3"
                            >
                              <p className="text-xs font-semibold text-primary">
                                {tag?.name}
                              </p>
                              <p className="mt-1 text-sm leading-5 text-foreground">
                                {selection.detail}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="mt-4 text-xs leading-5 text-guud-text-muted-2">
                        활동 {draft.activities.join(" · ")}
                        <br />
                        선호 방식 {draft.preferredMode}
                        {draft.participationScope && (
                          <>
                            <br />
                            참여 자격 {draft.participationScope}
                          </>
                        )}
                      </p>
                    </section>

                    <section className="rounded-2xl bg-foreground p-5 text-background">
                      <div className="flex items-center gap-2">
                        <Lock className="size-4 text-primary" />
                        <h3 className="text-sm font-semibold">
                          본인·운영자만 확인
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-background/55">
                        추천 생성에 필요한 최소 범위로만 사용됩니다.
                      </p>
                      <ul className="mt-4 space-y-2">
                        {draft.demandSelections.map((selection) => {
                          const tag = tags.find(
                            (item) => item.id === selection.tagId,
                          );
                          return (
                            <li
                              key={selection.tagId}
                              className="flex items-center justify-between gap-3 rounded-xl bg-background/10 px-3 py-2.5 text-sm"
                            >
                              <span>{tag?.name}</span>
                              {selection.priority && (
                                <span className="rounded-full bg-primary px-2 py-1 text-[0.625rem] font-semibold text-primary-foreground">
                                  가장 급함
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <p className="mt-4 text-xs leading-5 text-background/55">
                        가용시간 {draft.availability}
                        {isHotLead(draft.readiness) && (
                          <>
                            <br />
                            구체적 협업 프로젝트 포함
                          </>
                        )}
                      </p>
                    </section>
                  </div>
                  <VisibilityConsent
                    consents={{
                      publish: draft.visibilityConsent,
                      matching: draft.consentMatching,
                      quote: draft.consentQuote,
                    }}
                    onChange={(patch) =>
                      updateDraft({
                        ...(patch.publish !== undefined && {
                          visibilityConsent: patch.publish,
                        }),
                        ...(patch.matching !== undefined && {
                          consentMatching: patch.matching,
                        }),
                        ...(patch.quote !== undefined && {
                          consentQuote: patch.quote,
                        }),
                      })
                    }
                    // M2 P1-1: 원문(후속질문 답)이 있는 수요만 승인 대상 — 빈 문구 승인 금지.
                    safeMatchItems={draft.demandSelections.flatMap((sel) => {
                      const quote =
                        draft.followupAnswers
                          .find(
                            (a) => a.kind === "demand" && a.tagId === sel.tagId,
                          )
                          ?.answer?.trim() ?? "";
                      if (!quote) return [];
                      const approval = draft.safeMatchApprovals[sel.tagId];
                      return [
                        {
                          tagId: sel.tagId,
                          tagName:
                            tags.find((t) => t.id === sel.tagId)?.name ??
                            `수요 ${sel.tagId}`,
                          quote,
                          approved: approval?.approved ?? false,
                          text: approval?.text ?? quote,
                        },
                      ];
                    })}
                    onSafeMatchChange={(tagId, patch) => {
                      const quote =
                        draft.followupAnswers
                          .find((a) => a.kind === "demand" && a.tagId === tagId)
                          ?.answer?.trim() ?? "";
                      const prev = draft.safeMatchApprovals[tagId] ?? {
                        approved: false,
                        text: quote,
                      };
                      updateDraft({
                        safeMatchApprovals: {
                          ...draft.safeMatchApprovals,
                          [tagId]: { ...prev, ...patch },
                        },
                      });
                    }}
                  />
                  {finalizeError && (
                    <p className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="size-4" /> {finalizeError}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-guud-hairline bg-muted/30 px-6 py-5 sm:px-8">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 1}
            onClick={() => goToStep(Math.max(1, step - 1))}
          >
            <ArrowLeft className="size-4" /> 이전
          </Button>

          {step === 5 ? (
            <p className="max-w-xs text-right text-xs leading-5 text-guud-text-muted-2">
              보호 안내를 확인하면 한 줄 인터뷰로 이동합니다.
            </p>
          ) : step === 7 ? (
            <Button
              type="button"
              disabled={!draft.visibilityConsent || finalizing}
              onClick={handleFinalize}
            >
              {finalizing ? "확정하는 중…" : "확정하고 첫 추천 받기"}
              {!finalizing && <Sparkles className="size-4" />}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canProceed}
              onClick={() => goToStep(Math.min(TOTAL_STEPS, step + 1))}
            >
              다음 <ArrowRight className="size-4" />
            </Button>
          )}
        </footer>
      </section>
    </div>
  );
}
