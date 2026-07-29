// DAL: 세션 스토어 갱신형 쓰기 — 거절/만남후기/온보딩 확정. 서버 호출 없음(NFR-02).
// 근거: ARCHITECTURE.md §5.3 DAL 쓰기 계약, FR-FB-01~04, FR-ON-09

import declineReasonsSeed from "@/data/decline_reasons.json";
// P1-1: 클라이언트 경로에는 원문 인용이 소거된 redacted twin만 싣는다(raw quote 번들 0건 기준).
import recommendationsSeed from "@/data/people/derived/recommendations.redacted.json";
import {
  getEngineRecommendationsFor,
  parseEngineRecId,
} from "@/lib/dal/matching";
import { meetupsById } from "@/lib/dal/meetups";
import { getMember } from "@/lib/dal/members";
import { getRecommendations } from "@/lib/dal/recommendations";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  CapabilityOfferV1,
  DeclineReason,
  DeclineReasonCode,
  MaskedMember,
  NeedIntentV1,
  OnboardingFinalizeInput,
  Recommendation,
  ViewerContext,
} from "@/types";

export type { OnboardingFinalizeInput } from "@/types";

const declineReasons = declineReasonsSeed as DeclineReason[];
const recommendations = recommendationsSeed as Recommendation[];

/** 거절 사유 5종 + 엔진 반영 안내(FR-FB-01/02). */
export async function getDeclineReasons(): Promise<DeclineReason[]> {
  return declineReasons;
}

/** 뷰어가 이 추천의 수신 당사자(또는 운영자)인지 확인, 아니면 reject(타인 추천 조작 방지). */
async function assertIsRecipient(
  recId: string,
  vc: ViewerContext,
): Promise<void> {
  // M1: 엔진 추천은 시드에 없으므로 ID에 인코딩된 수신자로 판정한다.
  // P1-4: 임의 ID 조작 방지 — 현재 엔진 산출(서버)에 실재하는 추천인지도 검증한다(C3: 서비스 경유).
  const engineRef = parseEngineRecId(recId);
  if (engineRef) {
    if (vc.role !== "운영자" && vc.personaId !== engineRef.recipient) {
      throw new Error("본인에게 온 추천만 반응할 수 있습니다");
    }
    const recs = await getEngineRecommendationsFor({
      role: vc.role,
      personaId: engineRef.recipient,
    });
    if (!recs.some((r) => r.id === recId)) {
      throw new Error(`Recommendation not found: ${recId}`);
    }
    return;
  }
  const rec = recommendations.find((r) => r.id === recId);
  if (!rec) {
    throw new Error(`Recommendation not found: ${recId}`);
  }
  const isRecipient =
    vc.role === "운영자" ||
    rec.to_member_id === vc.personaId ||
    (rec.rec_kind === "모듬" &&
      rec.meetup_id !== undefined &&
      (meetupsById.get(rec.meetup_id)?.member_ids.includes(vc.personaId) ??
        false));
  if (!isRecipient) {
    throw new Error("본인에게 온 추천만 반응할 수 있습니다");
  }
}

/**
 * [패스] 원탭 거절(FR-FB-01/02/03). status→declined + 사유(+기타 메모)를 세션 스토어에 반영하고,
 * 엔진 반영 로직 안내(목업이라 실 로직 없음, effect_desc)를 반환한다.
 */
export async function submitDecline(
  vc: ViewerContext,
  recId: string,
  code: DeclineReasonCode,
  note?: string,
): Promise<DeclineReason> {
  await assertIsRecipient(recId, vc);
  const reason = declineReasons.find((r) => r.code === code);
  if (!reason) {
    throw new Error(`Unknown decline reason code: ${code}`);
  }
  useSessionInteractionStore.getState().setRecommendationOverride(recId, {
    status: "declined",
    decline_reason: code,
    decline_note: note,
  });
  return reason;
}

/** 만남 후기 수집(FR-FB-04). 세션 스토어에만 반영. */
export async function submitMeetingOutcome(
  vc: ViewerContext,
  recId: string,
  outcome: { met: boolean; will_meet_again: boolean; note: string },
): Promise<void> {
  await assertIsRecipient(recId, vc);
  useSessionInteractionStore.getState().setRecommendationOverride(recId, {
    meeting_outcome: outcome,
  });
}

// OnboardingFinalizeInput 타입은 @/types/onboarding.ts로 이동(스토어 스냅샷 보존용 — 순환 방지).
// 위 re-export로 기존 import 경로 호환을 유지한다.

/**
 * 온보딩 확정(FR-ON-09). M1: 입력을 무손실로 Need/Offer 아이템으로 변환해 세션에 적립하고,
 * 매칭엔진이 즉시 반영한다(JSON-first — 영속 저장은 M4 DB 승인 후 POST /onboarding/finalize로 교체,
 * automationRegistry FR-ON-09 swap_point). 원문 detail_quote는 그대로 보존(BR-02),
 * safe_match_text는 draft 상태로 두어 사용자 승인 전 임베딩 입력을 차단한다.
 */
export async function finalizeOnboarding(
  vc: ViewerContext,
  profile: OnboardingFinalizeInput,
): Promise<{ member: MaskedMember; firstRecommendations: Recommendation[] }> {
  const now = new Date().toISOString();
  const revision = 2; // 시드(revision 1) 위의 세션 개정판
  // P1-3: 질문하지 않아 답이 없는 항목은 빈 원문으로 저장 — 시스템 문구를 사용자 quote로 날조하지 않는다.
  const needs: NeedIntentV1[] = profile.demand_tags.map((d, i) => ({
    id: `need-session-${vc.personaId}-${d.tagId}-${i}`,
    owner: { kind: "person", id: vc.personaId },
    tag_ids: [d.tagId],
    detail_quote: d.detail_quote,
    safe_match_status: "draft",
    priority: d.priority ? "primary" : "normal",
    urgency: profile.hot_lead?.flag ? "time_sensitive" : "active",
    constraints: [],
    status: "active",
    source: "onboarding",
    profile_revision: revision,
    created_at: now,
  }));
  const offers: CapabilityOfferV1[] = profile.supply_tags.map((s, i) => ({
    id: `offer-session-${vc.personaId}-${s.tagId}-${i}`,
    owner: { kind: "person", id: vc.personaId },
    tag_ids: [s.tagId],
    detail: s.detail,
    status: "active",
    source: "onboarding",
    profile_revision: revision,
    created_at: now,
  }));

  const store = useSessionInteractionStore.getState();
  // P1-3: 전체 스냅샷 보존(무손실) + 동의 3종 receipt를 세션에 그대로 남긴다.
  store.storeOnboardingResult(vc.personaId, {
    snapshot: profile,
    needs,
    offers,
    consents: {
      publish: profile.consents.publish_profile,
      matching: profile.consents.use_private_needs_for_matching,
      quote: profile.consents.quote_in_intro,
    },
  });
  store.finalizeOnboardingFor(vc.personaId);

  const member = await getMember(vc, vc.personaId);
  const { common, different } = await getRecommendations(vc);
  const firstRecommendations = [...common, ...different].filter(
    (rec) => rec.status === "pending_review",
  );
  return { member, firstRecommendations };
}
