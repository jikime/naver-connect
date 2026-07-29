// 매칭 서비스 — 서버 권위 구현(C3: move private matching inputs behind server boundary).
// 클라이언트는 이 모듈을 import하지 않는다(app/api/matching route 또는 테스트 transport만 접근,
// eslint 클라존 가드 + bundle privacy 게이트가 강제). 여기서만 private 원본(needs/consents/
// match_scores/recommendations)을 읽고, 클라이언트에는 최소 DTO(MatchingBundle)만 반환한다.
// 세션 상태(온보딩 적립·거절 오버라이드·가중치)는 요청 파라미터로 받는다 — mock auth 전제:
// 역할 스위처가 인증을 대신하는 데모 구조라 personaId/session은 클라이언트 신고값이다(M4에서 실인증).
// 근거: codex final-rereview-reject #1, people_match_retrieval_plan.md §6, research_synthesis.md §13

import collabRelationsSeed from "@/data/collab_relations.json";
import meetupsSeed from "@/data/meetups.json";
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
import {
  type ConsentReceiptResolver,
  issueSafeMatchReceipt,
  toEngineNeed,
} from "@/lib/matching/receipt";
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
  Meetup,
  MemberPublicSeed,
  NeedIntentV1,
  Recommendation,
  RecStatus,
  RuleWeight,
  SafeMatchReceipt,
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
  /**
   * C4(#3): 주간 목록에서 숨길 declined 시드 추천 id(사유 5종 전부, 원본 status·세션
   * override 불문). 뷰어가 당사자(1:1 endpoint/모듬 참여자)이거나 운영자인 건만 담아
   * 타인 추천의 거절 상태를 열거하지 못하게 한다. 상세(영수증) 조회는 계속 허용된다.
   */
  hiddenSeedRecIds: string[];
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
const meetups = meetupsSeed as Meetup[];
const meetupsById = new Map(meetups.map((m) => [m.id, m]));
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

/** 세션 온보딩 동의의 합성 영수증 id — finalize가 발급받아 need 영수증이 참조한다. */
function sessionConsentReceiptId(personId: string): string {
  return `consent-session-${personId}-use_private_needs_for_matching`;
}

/**
 * consent_receipt_id 해석기(M2 보완 #1) — 임의 문자열 참조를 차단한다.
 * 세션 합성 id는 해당 인물의 세션 매칭 동의가 실제 true일 때만,
 * 시드 id는 demo 모드에서 person·purpose 일치 + 미철회일 때만 유효.
 */
function consentReceiptResolverOf(
  session: MatchingSessionState,
): ConsentReceiptResolver {
  return (consentReceiptId, ownerId) => {
    if (consentReceiptId === sessionConsentReceiptId(ownerId)) {
      return session.onboardingResults[ownerId]?.consents.matching === true;
    }
    if (!isDemoMode()) return false;
    const record = seedConsents.find((c) => c.id === consentReceiptId);
    return (
      record !== undefined &&
      record.person_id === ownerId &&
      record.purpose === "use_private_needs_for_matching" &&
      record.withdrawn_at === undefined
    );
  };
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
  const resolver = consentReceiptResolverOf(session);
  const needs = [
    ...seedNeeds
      .filter((n) => n.status === "active" && !refreshed.has(n.owner.id))
      .map((n) => toEngineNeed(n, consentFn, resolver)),
    ...Object.values(results).flatMap((r) =>
      r.needs.map((n) => toEngineNeed(n, consentFn, resolver)),
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

/** 모듬 참여자 = meetups 시드 정본 참여자 ∪ 개설자(from_member_id). */
function meetupParticipantsOf(rec: Recommendation): string[] {
  if (rec.rec_kind !== "모듬" || !rec.meetup_id) return [];
  const listed = meetupsById.get(rec.meetup_id)?.member_ids ?? [];
  if (listed.length === 0) return [];
  return listed.includes(rec.from_member_id)
    ? listed
    : [rec.from_member_id, ...listed];
}

/** 세션 override가 반영된 유효 status — 시드 원본과 세션 거절 어느 쪽이든 최신을 따른다. */
function mergedStatusOf(
  rec: Recommendation,
  session: MatchingSessionState,
): RecStatus {
  return session.recommendationOverrides[rec.id]?.status ?? rec.status;
}

/**
 * 노출 허용 시드 추천 id — 동의 gate. 주간 목록·상세·그래프 엣지의 공통 전제다.
 * - C4(#2): 모듬은 demo에서만 유효(seed 모듬은 목업 — non-demo 0건) + 참여자 전원 매칭 동의.
 *   참여자 목록이 비면 fail-closed로 제외.
 * - 1:1은 양측 매칭 동의(P1-2), to_member_id 없는 1:1은 fail-closed 제외.
 * declined 숨김은 hiddenSeedRecIds가 담당한다(상세 영수증 조회는 유지해야 하므로 분리).
 */
function computeAllowedSeedRecIds(session: MatchingSessionState): string[] {
  return recommendationsOriginal
    .filter((rec) => {
      if (rec.rec_kind === "모듬") {
        if (!isDemoMode()) return false;
        const participants = meetupParticipantsOf(rec);
        if (participants.length === 0) return false;
        return participants.every((id) => matchingConsentOf(id, session));
      }
      if (!rec.to_member_id) return false;
      return (
        matchingConsentOf(rec.from_member_id, session) &&
        matchingConsentOf(rec.to_member_id, session)
      );
    })
    .map((r) => r.id);
}

/** 뷰어가 이 추천의 당사자인지(1:1 endpoint 또는 모듬 참여자). */
function isPartyOf(rec: Recommendation, personaId: string): boolean {
  if (rec.rec_kind === "모듬") {
    return meetupParticipantsOf(rec).includes(personaId);
  }
  return personaId === rec.from_member_id || personaId === rec.to_member_id;
}

/**
 * C4(#3): 주간 목록에서 숨길 declined 시드 추천 id — 사유 5종 전부, 원본 status·세션
 * override 불문. 당사자/운영자 스코프로만 담아 타인 거절 상태 열거를 차단한다.
 */
function computeHiddenSeedRecIds(req: MatchingRequest): string[] {
  return recommendationsOriginal
    .filter(
      (rec) =>
        mergedStatusOf(rec, req.session) === "declined" &&
        (req.role === "운영자" || isPartyOf(rec, req.personaId)),
    )
    .map((r) => r.id);
}

/**
 * 뷰어 권한 반영 그래프 엣지(#1~#3 patch 정책 + C4 모듬 이관).
 * allowedSeedRecIds(동의·non-demo 모듬 gate) 통과분에서 declined를 제외하고,
 * 뷰어 당사자 판정을 얹는다: 운영자=전체, 일반=본인이 endpoint(1:1) 또는 참여자(모듬)인 것만.
 * 거절된 연결은 그래프에도 광고하지 않는다(C4 #3의 그래프 대응).
 */
function computeGraphEdges(req: MatchingRequest): MatchingGraphEdge[] {
  const allowed = new Set(computeAllowedSeedRecIds(req.session));
  const edges: MatchingGraphEdge[] = [];
  for (const rec of recommendationsOriginal) {
    if (!allowed.has(rec.id)) continue;
    const status = mergedStatusOf(rec, req.session);
    if (status === "declined") continue;
    if (req.role !== "운영자" && !isPartyOf(rec, req.personaId)) continue;
    if (rec.rec_kind === "모듬") {
      const organizer = rec.from_member_id;
      for (const memberId of meetupParticipantsOf(rec)) {
        if (memberId === organizer) continue;
        // 열거 불변식(기존 테스트 계약): 일반 회원 엣지는 항상 본인이 endpoint다.
        // 같은 모듬이라도 타 참여자 간 엣지는 운영자에게만 내려간다(멤버십 자체는 공개 시드).
        if (
          req.role !== "운영자" &&
          req.personaId !== organizer &&
          req.personaId !== memberId
        ) {
          continue;
        }
        edges.push({
          id: `${rec.id}:${memberId}`,
          from: organizer,
          to: memberId,
          match_type: rec.match_type,
          rec_kind: "모듬",
          status,
        });
      }
      continue;
    }
    if (!rec.to_member_id) continue;
    edges.push({
      id: rec.id,
      from: rec.from_member_id,
      to: rec.to_member_id,
      match_type: rec.match_type,
      rec_kind: "1:1",
      status,
    });
  }
  return edges;
}

// ── safe_match_text 승인 영수증 서버 발급(M2 온보딩 P1-1) ─────────────────────
// Codex 보완 #1: 클라이언트가 issueSafeMatchReceipt를 직접 호출하면 승인자·동의 참조를
// 스스로 꾸밀 수 있다. 승인 의사(문구)만 받고, 서버가 owner·동의를 확인해 원자 발급한다.
// mock auth 전제(C3 문서화된 경계): personaId/session은 클라이언트 신고값 — 실인증 결속은 M4.

export interface SafeTextApproval {
  needId: string;
  text: string;
}

export interface SafeTextConfirmRequest {
  personaId: string;
  approvals: SafeTextApproval[];
  session: MatchingSessionState;
}

export interface SafeTextConfirmResult {
  needId: string;
  text: string;
  receipt: SafeMatchReceipt;
}

/**
 * 온보딩 세션 need의 매칭용 문구를 확정하고 영수증을 발급한다.
 * fail-closed: 온보딩 결과 부재·매칭 동의 없음·타인 need·미존재 need·빈 문구는 전부 reject.
 */
export function confirmSafeMatchTexts(
  req: SafeTextConfirmRequest,
): SafeTextConfirmResult[] {
  const result = req.session.onboardingResults[req.personaId];
  if (!result) {
    throw new Error("승인할 온보딩 결과가 없습니다");
  }
  if (!matchingConsentOf(req.personaId, req.session)) {
    throw new Error("매칭 사용 동의(B) 없이 매칭 문구를 확정할 수 없습니다");
  }
  const consentReceiptId = sessionConsentReceiptId(req.personaId);
  const confirmedAt = new Date().toISOString();
  return req.approvals.map((approval) => {
    const need = result.needs.find((n) => n.id === approval.needId);
    if (!need) {
      throw new Error(`승인 대상 need가 없습니다: ${approval.needId}`);
    }
    if (need.owner.id !== req.personaId) {
      throw new Error("본인 need만 승인할 수 있습니다");
    }
    const text = approval.text.trim();
    if (text.length === 0) {
      throw new Error("빈 매칭 문구는 승인할 수 없습니다");
    }
    const receipt = issueSafeMatchReceipt(
      { ...need, safe_match_text: text },
      req.personaId,
      consentReceiptId,
      confirmedAt,
    );
    return { needId: need.id, text, receipt };
  });
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
    engineRecommendations:
      req.role === "운영자"
        ? members.flatMap((member) =>
            buildEngineRecommendations(member.id, req.session),
          )
        : buildEngineRecommendations(req.personaId, req.session),
    allowedSeedRecIds: computeAllowedSeedRecIds(req.session),
    hiddenSeedRecIds: computeHiddenSeedRecIds(req),
    graphEdges: computeGraphEdges(req),
  };
}
