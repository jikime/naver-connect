// DAL: 매칭 — M1부터 목업 공식(40+Σw×12)이 아니라 reciprocal 매칭 엔진(src/lib/matching)을 호출한다.
// 계약 불변: getMatchScores/setRuleWeights 시그니처·반환 타입·ForbiddenError·RuleWeight 레버 유지
// (automationRegistry FR-RL-03 swap_point "시드 점수 재계산 시뮬레이션 → 매칭엔진 실추론" 이행 지점).
// 엔진 입력은 이 파일에서 조립한다: 시드 people 아이템 + 세션 온보딩 적립분 + 거절 이력 + 조직 그래프.
// 근거: people_match_retrieval_plan.md §6, plans/generic-mixing-seahorse.md M1-7

import collabRelationsSeed from "@/data/collab_relations.json";
import membersPublicSeed from "@/data/members.json";
import organizationsSeed from "@/data/organizations.json";
import engineNeedsSeed from "@/data/people/derived/engine-needs.json";
import impactIntentsSeed from "@/data/people/impact_intents.json";
import offersSeed from "@/data/people/offers.json";
import matchScoresSeed from "@/data/private/match_scores.json";
// P1-1: 클라이언트 경로에는 원문 인용이 소거된 redacted twin만 싣는다(raw quote 번들 0건 기준).
import recommendationsSeed from "@/data/people/derived/recommendations.redacted.json";
import tagsSeed from "@/data/tags.json";
import { getConsentFlags } from "@/lib/consent";
import { ForbiddenError } from "@/lib/dal/errors";
import type {
  DeclineRecord,
  EngineInput,
  EngineNeed,
  EngineOffer,
  EngineOutput,
} from "@/lib/matching/engine";
import { runEngine } from "@/lib/matching/engine";
import { buildExplanation } from "@/lib/matching/explain";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  CapabilityOfferV1,
  ImpactIntentV1,
  MatchScore,
  MatchScoresSeed,
  MemberPublicSeed,
  NeedIntentV1,
  Recommendation,
  RuleWeight,
  Tag,
  ViewerContext,
} from "@/types";

const members = membersPublicSeed as MemberPublicSeed[];
const scoresSeed = matchScoresSeed as MatchScoresSeed;
const recommendations = recommendationsSeed as Recommendation[];
const tags = tagsSeed as Tag[];
// P1-1: 클라이언트 경로에는 원문 없는 파생 DTO만 — private needs/consents는 이 파일에서 import 금지
const seedEngineNeeds = engineNeedsSeed as EngineNeed[];
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

/** 조직 그래프 → 사람 엣지: 두 회원의 소속 조직이 collab_relations(실제)로 연결되면 사람 엣지. */
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

/**
 * 거절 이력: 시드 status + 세션 오버라이드 병합 — 거절자(수신자) 기준 방향 레코드.
 * P1-4: 엔진 추천(REC-ENG:*)에 대한 세션 거절도 DeclineRecord로 투영해 재실행에 반영한다.
 */
function buildDeclines(): DeclineRecord[] {
  const overrides =
    useSessionInteractionStore.getState().recommendationOverrides;
  const out: DeclineRecord[] = [];
  for (const rec of recommendations) {
    if (rec.rec_kind === "모듬" || !rec.to_member_id) continue;
    const merged = overrides[rec.id] ? { ...rec, ...overrides[rec.id] } : rec;
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

/** 세션 NeedIntent → 엔진 DTO. match_text는 user-confirmed safe_match_text만(아니면 ""). */
function toEngineNeed(n: NeedIntentV1): EngineNeed {
  return {
    id: n.id,
    ownerId: n.owner.id,
    tag_ids: n.tag_ids,
    match_text:
      n.safe_match_status === "user_confirmed" ? (n.safe_match_text ?? "") : "",
    priority: n.priority,
    urgency: n.urgency,
    constraints: n.constraints,
    status: n.status,
  };
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

/** 시드 people 아이템 위에 세션 온보딩 적립분을 겹친다(해당 persona의 시드 아이템은 대체). */
function mergeWithSession(): {
  needs: EngineNeed[];
  offers: EngineOffer[];
} {
  const results = useSessionInteractionStore.getState().onboardingResults;
  const refreshed = new Set(Object.keys(results));
  const needs = [
    ...seedEngineNeeds.filter(
      (n) => n.status === "active" && !refreshed.has(n.ownerId),
    ),
    ...Object.values(results).flatMap((r) => r.needs.map(toEngineNeed)),
  ];
  const offers = [
    ...seedOffers.filter((o) => !refreshed.has(o.owner.id)).map(toEngineOffer),
    ...Object.values(results).flatMap((r) => r.offers.map(toEngineOffer)),
  ];
  return { needs, offers };
}

function activeWeights(): RuleWeight[] {
  return (
    useSessionInteractionStore.getState().ruleWeightOverrides ??
    scoresSeed.rule_weights
  );
}

/** 엔진 실행(전수 pair, n=8). 설명 조립에 입력이 필요해 input도 함께 반환한다. */
export function runMatchingEngine(): {
  input: EngineInput;
  output: EngineOutput;
} {
  const { needs, offers } = mergeWithSession();
  const input: EngineInput = {
    personIds: members.map((m) => m.id),
    needs,
    offers,
    impactIntents: seedImpacts,
    personContext: Object.fromEntries(
      members.map((m) => [
        m.id,
        {
          region: { sido: m.region.sido, sigungu: m.region.sigungu },
          fieldIds: m.field_tags,
          keywords: m.keyword_set,
          hotLead: m.hot_lead,
        },
      ]),
    ),
    orgEdges: buildOrgEdges(),
    declines: buildDeclines(),
    hasMatchingConsent: (personId) => getConsentFlags(personId).matching,
    ruleWeights: activeWeights(),
    tagNames: TAG_NAMES,
  };
  return { input, output: runEngine(input) };
}

/** 엔진 추천 ID — 회원 ID에 '-'가 들어가므로 구분자는 ':'를 쓴다. */
export const ENGINE_REC_PREFIX = "REC-ENG:";

export function parseEngineRecId(
  id: string,
): { recipient: string; other: string } | null {
  if (!id.startsWith(ENGINE_REC_PREFIX)) return null;
  const [, recipient, other] = id.split(":");
  return recipient && other ? { recipient, other } : null;
}

/**
 * 뷰어에게 보낼 엔진 추천을 Recommendation 계약으로 투영한다(M1-7 병행 노출).
 * 시드에 이미 같은 pair의 수동 추천이 있으면 중복 생성하지 않는다.
 * BR-01 강화: contact_point에 원문을 싣지 않고 min_exposure 문구만 저장 —
 * 원문은 reason_pointers(need id)로만 참조하고 본인 화면에서 people DAL로 조회한다(M2).
 */
export function buildEngineRecommendationsFor(
  personaId: string,
): Recommendation[] {
  const { input, output } = runMatchingEngine();
  const covered = new Set(
    recommendations
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

/**
 * 매칭 점수 조회(FR-RL-01) — 엔진 산출 pair를 기존 MatchScore 계약으로 투영한다.
 * 가중치 세션 편집분이 있으면 엔진이 반영해 재산출한다(FR-RL-03).
 */
export async function getMatchScores(
  _vc: ViewerContext,
): Promise<{ scores: MatchScore[]; weights: RuleWeight[] }> {
  const { output } = runMatchingEngine();
  const scores: MatchScore[] = output.pairs.map((p) => ({
    from_member_id: p.from,
    to_member_id: p.to,
    score: p.score,
    shared_keywords: p.shared_keywords,
    complementary_keywords: p.complementary_keywords,
    axis: p.axis,
  }));
  return { scores, weights: activeWeights() };
}

/**
 * 관리자 가중치 편집(FR-RL-02) + 재산출(FR-RL-03). 운영자가 아니면 403 시뮬레이션.
 * 세션 스토어만 갱신(NFR-02) — 새로고침 시 시드 원본으로 리셋(A6).
 */
export async function setRuleWeights(
  vc: ViewerContext,
  weights: RuleWeight[],
): Promise<{ scores: MatchScore[]; weights: RuleWeight[] }> {
  if (vc.role !== "운영자") {
    throw new ForbiddenError();
  }
  useSessionInteractionStore.getState().setRuleWeightOverrides(weights);
  return getMatchScores(vc);
}
