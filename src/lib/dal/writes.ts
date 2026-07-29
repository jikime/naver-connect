// DAL: 추천 거절·만남후기·온보딩 확정의 서버 영속 쓰기 경계.
// 근거: ARCHITECTURE.md §5.3 DAL 쓰기 계약, FR-FB-01~04, FR-ON-09

import { getDataset } from "@/lib/dal/datasets";
import {
  getEngineRecommendationsFor,
  parseEngineRecId,
} from "@/lib/dal/matching";
import {
  hydrateRuntimeState,
  setRuntimeStateValue,
} from "@/lib/dal/runtime-state";
import type {
  DeclineReason,
  DeclineReasonCode,
  MaskedMember,
  Meetup,
  OnboardingFinalizeInput,
  Recommendation,
  ViewerContext,
} from "@/types";

export type { OnboardingFinalizeInput } from "@/types";

/** 거절 사유 5종 + 엔진 반영 안내(FR-FB-01/02). */
export async function getDeclineReasons(): Promise<DeclineReason[]> {
  return getDataset<DeclineReason[]>("decline-reasons");
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
  const [recommendations, meetups] = await Promise.all([
    getDataset<Recommendation[]>("recommendations-redacted"),
    getDataset<Meetup[]>("meetups"),
  ]);
  const meetupsById = new Map(
    meetups.map((meetup) => [meetup.id, meetup] as const),
  );
  const rec = recommendations.find((r) => r.id === recId);
  if (!rec) {
    throw new Error(`Recommendation not found: ${recId}`);
  }
  const isRecipient =
    vc.role === "운영자" ||
    rec.to_member_id === vc.personaId ||
    (rec.rec_kind === "모둠" &&
      rec.meetup_id !== undefined &&
      (meetupsById.get(rec.meetup_id)?.member_ids.includes(vc.personaId) ??
        false));
  if (!isRecipient) {
    throw new Error("본인에게 온 추천만 반응할 수 있습니다");
  }
}

/**
 * [패스] 원탭 거절(FR-FB-01/02/03). status→declined + 사유(+기타 메모)를 서버에 저장하고,
 * 엔진 반영 안내(effect_desc)를 반환한다.
 */
export async function submitDecline(
  vc: ViewerContext,
  recId: string,
  code: DeclineReasonCode,
  note?: string,
): Promise<DeclineReason> {
  await assertIsRecipient(recId, vc);
  const state = await hydrateRuntimeState();
  const declineReasons = await getDataset<DeclineReason[]>("decline-reasons");
  const reason = declineReasons.find((r) => r.code === code);
  if (!reason) {
    throw new Error(`Unknown decline reason code: ${code}`);
  }
  await setRuntimeStateValue("recommendationOverrides", {
    ...state.recommendationOverrides,
    [recId]: {
      ...state.recommendationOverrides[recId],
      status: "declined",
      decline_reason: code,
      decline_note: note,
    },
  });
  return reason;
}

/** 만남 후기 수집(FR-FB-04). 로그인 사용자의 비공개 서버 상태에 저장한다. */
export async function submitMeetingOutcome(
  vc: ViewerContext,
  recId: string,
  outcome: { met: boolean; will_meet_again: boolean; note: string },
): Promise<void> {
  await assertIsRecipient(recId, vc);
  const state = await hydrateRuntimeState();
  await setRuntimeStateValue("recommendationOverrides", {
    ...state.recommendationOverrides,
    [recId]: {
      ...state.recommendationOverrides[recId],
      meeting_outcome: outcome,
    },
  });
}

// OnboardingFinalizeInput 타입은 @/types/onboarding.ts로 이동(스토어 스냅샷 보존용 — 순환 방지).
// 위 re-export로 기존 import 경로 호환을 유지한다.

/** 인증 세션의 사용자에게 온보딩 원문과 공개 프로필을 영속 저장한다. */
export async function finalizeOnboarding(
  _vc: ViewerContext,
  profile: OnboardingFinalizeInput,
): Promise<{ member: MaskedMember; firstRecommendations: Recommendation[] }> {
  const response = await fetch("/api/onboarding/finalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(profile),
  });
  const payload = (await response.json()) as {
    member?: MaskedMember;
    firstRecommendations?: Recommendation[];
    error?: string;
  };
  if (!response.ok || !payload.member || !payload.firstRecommendations) {
    throw new Error(payload.error ?? "온보딩 정보를 저장하지 못했습니다.");
  }
  return {
    member: payload.member,
    firstRecommendations: payload.firstRecommendations,
  };
}
