// SessionInteraction 스토어 — 추천 수락/거절/후기, 검수 승인, 온보딩 완료 플래그.
// 세션(브라우저 탭 생존) 한정 상태이며 서버 호출이 없다(NFR-02). DAL 쓰기 함수(T-003)가
// 이 스토어를 갱신하는 방식으로 "쓰기"를 시뮬레이션한다.
// 근거: ARCHITECTURE.md §3(L4)·§7 ADR-01, §5.3 DAL 쓰기 계약, TASKS.md T-006
// persist 미들웨어를 쓰지 않는다 — 새로고침 시 시드 초기값으로 리셋되는 것이 의도(A6).

import { create } from "zustand";
import type {
  CapabilityOfferV1,
  DealRoom,
  DeclineReasonCode,
  NeedIntentV1,
  OnboardingFinalizeInput,
  RecStatus,
  RuleWeight,
} from "@/types";

/**
 * M1(P1-3 무손실): 온보딩 확정이 적립하는 전체 스냅샷 + people 아이템 + 동의 3분리.
 * snapshot이 원본 계약(organization·region·field_tags·value_chain_stage·mission_statement·
 * activities·availability·preferred_mode·participation_scope·hot_lead·readiness·
 * trust_connections 포함)을 그대로 보존한다 — 시스템이 임의 요약·재구성하지 않는다.
 */
export interface OnboardingResult {
  snapshot: OnboardingFinalizeInput;
  needs: NeedIntentV1[];
  offers: CapabilityOfferV1[];
  consents: { publish: boolean; matching: boolean; quote: boolean };
}

/** 추천 1건에 대한 세션 오버라이드. DAL read 함수가 시드 위에 겹쳐 반환한다. */
export interface RecommendationOverride {
  status?: RecStatus;
  decline_reason?: DeclineReasonCode;
  decline_note?: string;
  meeting_outcome?: { met: boolean; will_meet_again: boolean; note: string };
}

interface SessionInteractionStore {
  /** recId → 세션 중 발생한 상태 변경(거절/후기/승인). */
  recommendationOverrides: Record<string, RecommendationOverride>;
  /** personaId → 온보딩 완료 여부(목업 finalizeOnboarding 플래그, FR-ON-09). */
  onboardingFinalized: Record<string, boolean>;
  /** v1.1 FR-RL-02/03: 관리자가 편집한 키워드 가중치(세션 한정). null이면 시드 rule_weights 그대로. */
  ruleWeightOverrides: RuleWeight[] | null;
  /** v1.1 FR-DS-01: 딜소싱 폼으로 등록된 딜(세션 한정). getDealRooms(FR-DR-05)가 시드에 겹쳐 반환한다. */
  registeredDeals: DealRoom[];
  /** M1: personaId → 온보딩 확정 산출물(Need/Offer/매칭동의). 매칭엔진이 시드 위에 겹쳐 읽는다. */
  onboardingResults: Record<string, OnboardingResult>;

  setRecommendationOverride: (
    recId: string,
    patch: RecommendationOverride,
  ) => void;
  finalizeOnboardingFor: (personaId: string) => void;
  storeOnboardingResult: (personaId: string, result: OnboardingResult) => void;
  setRuleWeightOverrides: (weights: RuleWeight[]) => void;
  addRegisteredDeal: (deal: DealRoom) => void;
  reset: () => void;
}

const INITIAL_STATE: Pick<
  SessionInteractionStore,
  | "recommendationOverrides"
  | "onboardingFinalized"
  | "ruleWeightOverrides"
  | "registeredDeals"
  | "onboardingResults"
> = {
  recommendationOverrides: {},
  onboardingFinalized: {},
  ruleWeightOverrides: null,
  registeredDeals: [],
  onboardingResults: {},
};

export const useSessionInteractionStore = create<SessionInteractionStore>(
  (set) => ({
    ...INITIAL_STATE,
    setRecommendationOverride: (recId, patch) =>
      set((state) => ({
        recommendationOverrides: {
          ...state.recommendationOverrides,
          [recId]: { ...state.recommendationOverrides[recId], ...patch },
        },
      })),
    finalizeOnboardingFor: (personaId) =>
      set((state) => ({
        onboardingFinalized: {
          ...state.onboardingFinalized,
          [personaId]: true,
        },
      })),
    storeOnboardingResult: (personaId, result) =>
      set((state) => ({
        onboardingResults: { ...state.onboardingResults, [personaId]: result },
      })),
    setRuleWeightOverrides: (weights) => set({ ruleWeightOverrides: weights }),
    addRegisteredDeal: (deal) =>
      set((state) => ({ registeredDeals: [...state.registeredDeals, deal] })),
    reset: () => set(INITIAL_STATE),
  }),
);
