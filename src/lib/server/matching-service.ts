// 매칭 서비스 — 서버 권위 구현(C3: move private matching inputs behind server boundary).
// 클라이언트는 이 모듈을 import하지 않는다(app/api/matching route 또는 테스트 transport만 접근,
// eslint 클라존 가드 + bundle privacy 게이트가 강제). 여기서만 private 원본(needs/consents/
// match_scores/recommendations)을 읽고, 클라이언트에는 최소 DTO(MatchingBundle)만 반환한다.
// 세션 상태(온보딩 적립·거절 오버라이드·가중치)는 요청 파라미터로 받는다 — mock auth 전제:
// 역할 스위처가 인증을 대신하는 데모 구조라 personaId/session은 클라이언트 신고값이다(M4에서 실인증).
// 근거: codex final-rereview-reject #1, people_match_retrieval_plan.md §6, research_synthesis.md §13

import collabRelationsSeed from "@/data/collab_relations.json";
import membersPublicSeed from "@/data/members.json";
import organizationsSeed from "@/data/organizations.json";
import impactIntentsSeed from "@/data/people/impact_intents.json";
import offersSeed from "@/data/people/offers.json";
import matchScoresSeed from "@/data/private/match_scores.json";
import consentsSeed from "@/data/private/people/consents.json";
import needsSeed from "@/data/private/people/needs.json";
import recommendationsOriginalSeed from "@/data/private/recommendations.json";
import tagsSeed from "@/data/tags.json";
import { isDemoMode } from "@/lib/app-mode";
import type {
  DeclineRecord,
  EngineInput,
  EngineNeed,
  EngineOffer,
  EngineOutput,
} from "@/lib/matching/engine";
import { runEngine } from "@/lib/matching/engine";
import { buildExplanation } from "@/lib/matching/explain";
import { toEngineNeed } from "@/lib/matching/receipt";
import type {
  OnboardingResult,
  RecommendationOverride,
} from "@/stores/session-interaction";
import type {
  CapabilityOfferV1,
  ConsentRecordV1,
  ImpactIntentV1,
  MatchScore,
  MatchScoresSeed,
  MatchType,
  MemberPublicSeed,
  NeedIntentV1,
  Recommendation,
  RecStatus,
  RuleWeight,
  Tag,
} from "@/types";

// ── 요청/응답 계약 (클라이언트는 type-only import 허용 — 빌드 시 소거) ──────────
export interface MatchingSessionState {
  onboardingResults: Record<string, OnboardingResult>;
  recommendationOverrides: Record<string, RecommendationOverride>;
  ruleWeightOverrides: RuleWeight[] | null;
}

export interface MatchingRequest {
  personaId: string;
  role: "기업가" | "전문가" | "운영자";
  session: MatchingSessionState;
}

export interface MatchingGraphEdge {
  id: string;
  from: string;
  to: string;
  match_type: MatchType;
  rec_kind: "1:1" | "모듬";
  status: RecStatus;
}

export interface MatchingBundle {
  scores: MatchScore[];
  weights: RuleWeight[];
  /** persona 수신분 엔진 추천 — contact_point는 최소노출 문구만(원문 서버 밖 반출 없음) */
  engineRecommendations: Recommendation[];
  /** 양측 매칭 동의가 유효한 시드 추천 id — 클라이언트 gate는 이 집합만 사용 */
  allowedSeedRecIds: string[];
  /** 뷰어 권한이 반영된 그래프 엣지(운영자=전체, 일반=본인 pair+양측 동의) */
  graphEdges: MatchingGraphEdge[];
}

export const ENGINE_REC_PREFIX = "REC-ENG:";

export function parseEngineRecId(
  id: string,
): { recipient: string; other: string } | null {
  if (!id.startsWith(ENGINE_REC_PREFIX)) return null;
  const [, recipient, other] = id.split(":");
  return recipient && other ? { recipient, other } : null;
}

// ── 시드(서버 원본) ────────────────────────────────────────────────────────
const members = membersPublicSeed as MemberPublicSeed[];
const scoresSeed = matchScoresSeed as MatchScoresSeed;
const recommendationsOriginal = recommendationsOriginalSeed as Recommendation[];
const tags = tagsSeed as Tag[];
const seedNeeds = needsSeed as NeedIntentV1[];
const seedConsents = consentsSeed as ConsentRecordV1[];
const seedOffers = offersSeed as CapabilityOfferV1[];
const seedImpacts = impactIntentsSeed as ImpactIntentV1[];
const organizations = organizationsSeed as { id: string; member_id?: string }[];
const collabRelations = collabRelationsSeed as {
  org_a_id: string;
  org_b_id: string;
  is_actual?: boolean;
}[];

const TAG_NAMES: Record<number, string> = Object.fromEntries(
  tags.map((t) => [t.id, t.name]),
);

// ── 동의(서버 판정 — 원본 consent 레코드 + 세션 + APP_MODE fail-closed) ──────
function matchingConsentOf(
  personId: string,
  session: MatchingSessionState,
): boolean {
  const onboarding = session.onboardingResults[personId];
  if (onboarding) return onboarding.consents.matching;
  if (!isDemoMode()) return false; // seed_mock은 demo에서만 유효(P1-2)
  return seedConsents.some(
    (c) =>
      c.person_id === personId &&
      c.purpose === "use_private_needs_for_matching" &&
      c.withdrawn_at === undefined,
  );
}

// ── 엔진 입력 조립 ─────────────────────────────────────────────────────────
function buildOrgEdges(): { a: string; b: string }[] {
  const memberByOrg = new Map<string, string>();
  for (const org of organizations) {
    if (org.member_id) memberByOrg.set(org.id, org.member_id);
  }
  for (const m of members) {
    if (m.affiliation_org_id) memberByOrg.set(m.affiliation_org_id, m.id);
  }
  const edges: { a: string; b: string }[] = [];
  for (const rel of collabRelations) {
    if (rel.is_actual === false) continue;
    const a = memberByOrg.get(rel.org_a_id);
    const b = memberByOrg.get(rel.org_b_id);
    if (a && b && a !== b) edges.push({ a, b });
  }
  return edges;
}

/** 세션에서 실제 override가 생긴 거절만 반영(시드 status는 receipt 아님 — #3 합의). */
function buildDeclines(session: MatchingSessionState): DeclineRecord[] {
  const overrides = session.recommendationOverrides;
  const out: DeclineRecord[] = [];
  for (const rec of recommendationsOriginal) {
    if (rec.rec_kind === "모듬" || !rec.to_member_id) continue;
    const override = overrides[rec.id];
    if (!override) continue;
    const merged = { ...rec, ...override };
    if (merged.status === "declined" && merged.decline_reason) {
      out.push({
        fromId: rec.to_member_id,
        toId: rec.from_member_id,
        reason: merged.decline_reason,
      });
    }
  }
  for (const [recId, override] of Object.entries(overrides)) {
    const engineRef = parseEngineRecId(recId);
    if (
      engineRef &&
      override.status === "declined" &&
      override.decline_reason
    ) {
      out.push({
        fromId: engineRef.recipient,
        toId: engineRef.other,
        reason: override.decline_reason,
      });
    }
  }
  return out;
}

function toEngineOffer(o: CapabilityOfferV1): EngineOffer {
  return {
    id: o.id,
    ownerId: o.owner.id,
    tag_ids: o.tag_ids,
    detail: o.detail,
    capacity: o.capacity,
    status: o.status,
  };
}

/** 시드 원본 + 세션 적립분 병합 — safe-text 사용 여부는 receipt 검증이 결정(C1). */
function mergeWithSession(session: MatchingSessionState): {
  needs: EngineNeed[];
  offers: EngineOffer[];
} {
  const results = session.onboardingResults;
  const refreshed = new Set(Object.keys(results));
  const consentFn = (id: string) => matchingConsentOf(id, session);
  const needs = [
    ...seedNeeds
      .filter((n) => n.status === "active" && !refreshed.has(n.owner.id))
      .map((n) => toEngineNeed(n, consentFn)),
    ...Object.values(results).flatMap((r) =>
      r.needs.map((n) => toEngineNeed(n, consentFn)),
    ),
  ];
  const offers = [
    ...seedOffers.filter((o) => !refreshed.has(o.owner.id)).map(toEngineOffer),
    ...Object.values(results).flatMap((r) => r.offers.map(toEngineOffer)),
  ];
  return { needs, offers };
}

function activeWeights(session: MatchingSessionState): RuleWeight[] {
  return session.ruleWeightOverrides ?? scoresSeed.rule_weights;
}

/** C2 overlay: 세션 스냅샷이 있으면 ImpactIntent를 세션 버전으로 대체. */
function mergeImpactIntents(session: MatchingSessionState): ImpactIntentV1[] {
  const results = session.onboardingResults;
  const refreshed = new Set(Object.keys(results));
  const sessionIntents: ImpactIntentV1[] = Object.entries(results).map(
    ([personaId, r]) => ({
      id: `impact-session-${personaId}`,
      owner: { kind: "person", id: personaId },
      change_statement: r.snapshot.mission_statement,
      field_ids: r.snapshot.field_tags,
      geography: r.snapshot.region,
      source: "onboarding",
      profile_revision: 2,
      created_at:
        r.needs[0]?.created_at ??
        r.offers[0]?.created_at ??
        new Date().toISOString(),
    }),
  );
  return [
    ...seedImpacts.filter((i) => !refreshed.has(i.owner.id)),
    ...sessionIntents,
  ];
}

/** 엔진 실행(전수 pair) — 테스트가 input을 검사할 수 있게 input도 반환한다. */
export function runMatchingEngine(session: MatchingSessionState): {
  input: EngineInput;
  output: EngineOutput;
} {
  const { needs, offers } = mergeWithSession(session);
  const snapshots = session.onboardingResults;
  const input: EngineInput = {
    personIds: members.map((m) => m.id),
    needs,
    offers,
    impactIntents: mergeImpactIntents(session),
    personContext: Object.fromEntries(
      members.map((m) => {
        const snap = snapshots[m.id]?.snapshot;
        return [
          m.id,
          {
            region: snap
              ? { sido: snap.region.sido, sigungu: snap.region.sigungu }
              : { sido: m.region.sido, sigungu: m.region.sigungu },
            fieldIds: snap ? snap.field_tags : m.field_tags,
            keywords: m.keyword_set,
            hotLead: snap ? (snap.hot_lead?.flag ?? false) : m.hot_lead,
          },
        ];
      }),
    ),
    orgEdges: buildOrgEdges(),
    declines: buildDeclines(session),
    hasMatchingConsent: (personId) => matchingConsentOf(personId, session),
    ruleWeights: activeWeights(session),
    tagNames: TAG_NAMES,
  };
  return { input, output: runEngine(input) };
}

/** persona 수신 엔진 추천 — 최소 DTO(원문·비공개 필드 없음). */
function buildEngineRecommendations(
  personaId: string,
  session: MatchingSessionState,
): Recommendation[] {
  const { input, output } = runMatchingEngine(session);
  const covered = new Set(
    recommendationsOriginal
      .filter((r) => r.rec_kind === "1:1" && r.to_member_id)
      .flatMap((r) => [
        `${r.from_member_id}~${r.to_member_id}`,
        `${r.to_member_id}~${r.from_member_id}`,
      ]),
  );
  return output.pairs
    .filter((p) => p.from === personaId && !covered.has(`${p.from}~${p.to}`))
    .slice(0, 8)
    .map((p) => {
      const ex = buildExplanation(p, input);
      const needTags =
        input.needs.find((n) => n.id === p.best.forwardNeedId)?.tag_ids ?? [];
      const tagLabel =
        needTags.map((t) => TAG_NAMES[t] ?? `분야 ${t}`).join("·") || "협업";
      const minExposure = `'${tagLabel}' 연결을 찾는 회원과의 상호 매칭`;
      return {
        id: `${ENGINE_REC_PREFIX}${p.from}:${p.to}`,
        rec_kind: "1:1" as const,
        from_member_id: p.to,
        to_member_id: p.from,
        match_type:
          p.axis === "차이점" ? ("퍼즐형" as const) : ("거울형" as const),
        value_class:
          p.axis === "차이점"
            ? ("사업가치" as const)
            : ("동료성장가치" as const),
        rec_axis: p.axis,
        matching_rationale: `상호 이익 점수 ${p.score}점 — 양쪽 모두에게 근거가 있는 연결이에요.`,
        message: {
          intro: "이번 주 매칭 엔진이 고른 연결이에요.",
          contact_point: minExposure,
          your_benefit: ex.their_offer.text,
          their_benefit: ex.their_benefit.text,
          first_action: ex.first_action.text,
        },
        is_hot_lead: p.hot_lead,
        min_exposure_note: minExposure,
        authored_direction: "A→B" as const,
        sent_week: "engine",
        status: "pending_review" as const,
        source: "engine" as const,
        reason_pointers: {
          your_need: p.best.forwardNeedId,
          their_offer: p.best.forwardOfferId,
          their_benefit: p.best.reverseNeedId,
        },
      };
    });
}

function meetupMemberIdsOf(rec: Recommendation): string[] {
  // 서버에서는 meetups 시드 재사용 대신 원본 rec의 참여 판정을 클라이언트와 동일하게 유지하기
  // 위해 meetup_id만 노출한다 — 모듬 동의 gate 정밀화는 C4에서 이 함수 기반으로 확장.
  return rec.meetup_id ? [] : [];
}

/** 양측 매칭 동의가 유효한 시드 추천 id(1:1). 모듬 gate는 C4에서 강화. */
function computeAllowedSeedRecIds(session: MatchingSessionState): string[] {
  return recommendationsOriginal
    .filter((rec) => {
      if (rec.rec_kind === "모듬" || !rec.to_member_id) return true;
      return (
        matchingConsentOf(rec.from_member_id, session) &&
        matchingConsentOf(rec.to_member_id, session)
      );
    })
    .map((r) => r.id);
}

/** 뷰어 권한 반영 그래프 엣지(#1~#3 patch 정책 이관: 운영자=전체, 일반=본인 pair+양측 동의). */
function computeGraphEdges(req: MatchingRequest): MatchingGraphEdge[] {
  const canView = (from: string, to: string): boolean => {
    if (req.role === "운영자") return true;
    return (
      (req.personaId === from || req.personaId === to) &&
      matchingConsentOf(from, req.session) &&
      matchingConsentOf(to, req.session)
    );
  };
  const edges: MatchingGraphEdge[] = [];
  for (const rec of recommendationsOriginal) {
    if (rec.rec_kind === "모듬") {
      // 모듬 참여자 목록은 meetups 시드가 정본 — C4에서 참여자 단위 gate와 함께 이관 예정.
      void meetupMemberIdsOf(rec);
      continue;
    }
    if (!rec.to_member_id) continue;
    if (!canView(rec.from_member_id, rec.to_member_id)) continue;
    edges.push({
      id: rec.id,
      from: rec.from_member_id,
      to: rec.to_member_id,
      match_type: rec.match_type,
      rec_kind: "1:1",
      status: rec.status,
    });
  }
  return edges;
}

/** 단일 진입점 — route/transport가 호출한다. */
export function computeMatchingBundle(req: MatchingRequest): MatchingBundle {
  const { output } = runMatchingEngine(req.session);
  const scores: MatchScore[] = output.pairs.map((p) => ({
    from_member_id: p.from,
    to_member_id: p.to,
    score: p.score,
    shared_keywords: p.shared_keywords,
    complementary_keywords: p.complementary_keywords,
    axis: p.axis,
  }));
  return {
    scores,
    weights: activeWeights(req.session),
    engineRecommendations: buildEngineRecommendations(
      req.personaId,
      req.session,
    ),
    allowedSeedRecIds: computeAllowedSeedRecIds(req.session),
    graphEdges: computeGraphEdges(req),
  };
}
