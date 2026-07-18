"use client";

// OnbWizard — 온보딩 위저드 셸. 7스텝 진행 상태·검증·데이터 패칭을 소유한다.
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a/T-009b, FR-ON-01~11
// 스텝: ①프로필확인 ②수요3+★1 ③공급3 ④협력성향4문항 ⑤민감정보고지 ⑥AI후속질문 ⑦확정.
// 협업준비도='구체적 프로젝트 있음'→hot_lead(스텝6 후속질문 +3 분기 트리거, FR-ON-05).

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchTypeBadge } from "@/components/shared/MatchTypeBadge";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { Button } from "@/components/ui/button";
import {
  finalizeOnboarding,
  getInterviewScript,
  getMember,
  getOnboardingMeta,
  getTags,
} from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type {
  MaskedMember,
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
  STEP_TITLES,
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

function canProceedFromStep(step: number, draft: OnboardingDraft): boolean {
  switch (step) {
    case 1:
      return (
        draft.orgName.trim().length > 0 &&
        draft.sido.trim().length > 0 &&
        draft.sigungu.trim().length > 0 &&
        draft.missionStatement.trim().length > 0
      );
    case 2:
      return (
        draft.demandSelections.length === 3 &&
        draft.demandSelections.some((s) => s.priority)
      );
    case 3:
      return (
        draft.supplySelections.length === 3 &&
        draft.supplySelections.every((s) => s.detail.trim().length > 0)
      );
    case 4:
      return (
        draft.activities.length > 0 &&
        draft.availability.length > 0 &&
        draft.preferredMode.length > 0 &&
        draft.readiness.length > 0
      );
    case 6:
      return draft.followupDone;
    default:
      return true;
  }
}

export function OnbWizard() {
  const vc = useViewerContext();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [scriptMeta, setScriptMeta] = useState<OnboardingScriptMeta | null>(
    null,
  );

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OnboardingDraft>(createEmptyDraft());
  const [followupQueue, setFollowupQueue] = useState<FollowupQueueItem[]>([]);

  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [result, setResult] = useState<FinalizeResult | null>(null);

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
          trustConnections: memberRes.trust_connections,
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
        });
      }
    }
    if (isHotLead(draft.readiness) && scriptMeta) {
      for (const [i, q] of scriptMeta.hot_lead_deep_questions.entries()) {
        items.push({ id: `hotlead-${i}`, kind: "hot_lead", question: q });
      }
    }

    setFollowupQueue(items);
    setStep(6);
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
        return {
          tagId: sel.tagId,
          priority: sel.priority,
          detail_quote:
            followup?.answer && followup.answer.length > 0
              ? followup.answer
              : "(온보딩 후속질문에서 다루지 않음)",
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
        demand_tags,
        supply_tags,
        activities: draft.activities,
        preferred_mode: draft.preferredMode,
        hot_lead,
        visibility_consent: draft.visibilityConsent,
      });
      setResult(finalized);
    } catch (e) {
      setFinalizeError(
        e instanceof Error ? e.message : "확정 중 문제가 발생했어요.",
      );
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-guud-text-muted-2">불러오는 중이에요…</p>;
  }

  if (loadError) {
    return (
      <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <p>{loadError}</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-5">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          온보딩 완료
        </h1>
        <p className="text-sm text-guud-text-muted-2">
          확정된 프로필로 며칠 안에 꼭 만나야 할 회원 세 분을 준비했어요.
        </p>
        <ul className="space-y-2">
          {result.firstRecommendations.map((rec) => (
            <li
              key={rec.id}
              className="flex flex-wrap items-center gap-2 border border-guud-hairline p-3"
            >
              <MatchTypeBadge type={rec.match_type} />
              <span className="text-sm text-foreground">
                {rec.rec_kind === "모듬"
                  ? (rec.meetup?.purpose ?? "모듬 추천")
                  : rec.matching_rationale}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/recommendations">
              주간 추천 보러가기 <AutomationLevelBadge frId="FR-RC-01" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">내 프로필 보기</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canProceed = canProceedFromStep(step, draft);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-1.5 w-full bg-muted" aria-hidden>
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {STEP_TITLES[step - 1]}
          </h1>
          <span className="text-xs font-semibold text-guud-text-muted-2">
            {step}/{TOTAL_STEPS}단계
          </span>
        </div>
      </div>

      {step === 1 && (
        <ProfileConfirmStep draft={draft} onChange={updateDraft} mode="edit" />
      )}
      {step === 2 && (
        <DemandSelectStep tags={tags} draft={draft} onChange={updateDraft} />
      )}
      {step === 3 && (
        <SupplySelectStep tags={tags} draft={draft} onChange={updateDraft} />
      )}
      {step === 4 && (
        <CollaborationTraitsStep draft={draft} onChange={updateDraft} />
      )}
      {step === 5 && scriptMeta && (
        <SensitiveInfoNotice
          notice={scriptMeta.sensitive_notice}
          onAcknowledge={handleAcknowledgeNotice}
        />
      )}
      {step === 6 && (
        <FollowupQuestionStep
          queue={followupQueue}
          onAnswer={handleFollowupAnswer}
          onComplete={() => updateDraft({ followupDone: true })}
          done={draft.followupDone}
        />
      )}
      {step === 7 && (
        <div className="space-y-4">
          <ProfileConfirmStep
            draft={draft}
            onChange={updateDraft}
            mode="review"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-guud-hairline p-3">
              <p className="mb-2 text-xs font-semibold text-guud-text-muted-2">
                공개 프로필에 표시
              </p>
              <ul className="space-y-1 text-sm text-foreground">
                {draft.supplySelections.map((s) => {
                  const tag = tags.find((t) => t.id === s.tagId);
                  return (
                    <li key={s.tagId}>
                      {tag?.name}: {s.detail}
                    </li>
                  );
                })}
                <li>활동: {draft.activities.join(", ")}</li>
                <li>선호 방식: {draft.preferredMode}</li>
              </ul>
            </div>
            <div className="border border-dashed border-guud-text-faint p-3">
              <p className="mb-2 text-xs font-semibold text-guud-text-muted-2">
                비공개(본인·운영자만)
              </p>
              <ul className="space-y-1 text-sm text-foreground">
                {draft.demandSelections.map((s) => {
                  const tag = tags.find((t) => t.id === s.tagId);
                  return (
                    <li key={s.tagId}>
                      {s.priority ? "★ " : ""}
                      {tag?.name}
                    </li>
                  );
                })}
                <li>가용시간: {draft.availability}</li>
                {isHotLead(draft.readiness) && <li>핫리드 대상</li>}
              </ul>
            </div>
          </div>
          <VisibilityConsent
            checked={draft.visibilityConsent}
            onChange={(checked) => updateDraft({ visibilityConsent: checked })}
          />
          {finalizeError && (
            <p className="text-sm text-destructive">{finalizeError}</p>
          )}
        </div>
      )}

      {step !== 5 && (
        <div className="flex items-center justify-between border-t border-guud-hairline pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            이전
          </Button>
          {step === 7 ? (
            <Button
              type="button"
              disabled={!draft.visibilityConsent || finalizing}
              onClick={handleFinalize}
            >
              {finalizing ? "확정하는 중…" : "확정하고 첫 추천 받기"}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canProceed}
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            >
              다음
            </Button>
          )}
        </div>
      )}
      {step === 5 && (
        <div className="border-t border-guud-hairline pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            이전
          </Button>
        </div>
      )}
    </div>
  );
}
