// DAL: 세션 스토어 갱신형 쓰기 — 거절/만남후기/온보딩 확정. 서버 호출 없음(NFR-02).
// 근거: ARCHITECTURE.md §5.3 DAL 쓰기 계약, FR-FB-01~04, FR-ON-09

import declineReasonsSeed from "@/data/decline_reasons.json";
import recommendationsSeed from "@/data/private/recommendations.json";
import { meetupsById } from "@/lib/dal/meetups";
import { getMember } from "@/lib/dal/members";
import { getRecommendations } from "@/lib/dal/recommendations";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  DeclineReason,
  DeclineReasonCode,
  MaskedMember,
  Recommendation,
  ViewerContext,
} from "@/types";

const declineReasons = declineReasonsSeed as DeclineReason[];
const recommendations = recommendationsSeed as Recommendation[];

/** 거절 사유 5종 + 엔진 반영 안내(FR-FB-01/02). */
export async function getDeclineReasons(): Promise<DeclineReason[]> {
  return declineReasons;
}

/** 뷰어가 이 추천의 수신 당사자(또는 운영자)인지 확인, 아니면 reject(타인 추천 조작 방지). */
function assertIsRecipient(recId: string, vc: ViewerContext): void {
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
  assertIsRecipient(recId, vc);
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
  assertIsRecipient(recId, vc);
  useSessionInteractionStore.getState().setRecommendationOverride(recId, {
    meeting_outcome: outcome,
  });
}

/** finalizeOnboarding 입력(목업 — 실제 온보딩 위저드 스텝 산출은 T-009). */
export interface OnboardingFinalizeInput {
  demand_tags: { tagId: number; priority: boolean; detail_quote: string }[];
  supply_tags: { tagId: number; detail: string }[];
  activities: string[];
  preferred_mode: string;
  hot_lead: {
    flag: boolean;
    project_summary: string;
    needed_partner: string;
    stage: string;
  } | null;
  visibility_consent: boolean;
}

/**
 * 온보딩 확정(FR-ON-09). 목업이므로 새 회원/추천을 실제로 생성하지 않고, 세션에 완료
 * 플래그만 남긴 뒤 프로필 카드(getMember)와 이미 pending_review 상태인 첫 추천을 반환한다.
 * 향후 백엔드 도입 시 POST /onboarding/finalize로 교체된다(automationRegistry FR-ON-09 swap_point).
 */
export async function finalizeOnboarding(
  vc: ViewerContext,
  _profile: OnboardingFinalizeInput,
): Promise<{ member: MaskedMember; firstRecommendations: Recommendation[] }> {
  useSessionInteractionStore.getState().finalizeOnboardingFor(vc.personaId);
  const member = await getMember(vc, vc.personaId);
  const { common, different } = await getRecommendations(vc);
  const firstRecommendations = [...common, ...different].filter(
    (rec) => rec.status === "pending_review",
  );
  return { member, firstRecommendations };
}
