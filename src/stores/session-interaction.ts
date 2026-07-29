// SessionInteraction 스토어 — 서버에서 읽은 추천·딜·온보딩 상태의 화면 반응용 캐시.
// 정본은 ax_private.user_runtime_states이며 localStorage에는 저장하지 않는다.
// 근거: ARCHITECTURE.md §3(L4)·§7 ADR-01, §5.3 DAL 쓰기 계약, TASKS.md T-006
// 온보딩 결과와 상호작용은 서버가 인증 사용자별 DB 상태에서 읽어 내려준다.

import { create } from "zustand";
import type {
  CapabilityOfferV1,
  DealRoom,
  DeclineReasonCode,
  MemberEmbeddingShadow,
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

/** 추천 1건에 대한 사용자 오버라이드. DAL read 함수가 기본 데이터 위에 겹쳐 반환한다. */
export interface RecommendationOverride {
  status?: RecStatus;
  decline_reason?: DeclineReasonCode;
  decline_note?: string;
  meeting_outcome?: { met: boolean; will_meet_again: boolean; note: string };
}

export interface SessionInteractionStore {
  /** recId → 저장된 상태 변경(거절/후기/승인). */
  recommendationOverrides: Record<string, RecommendationOverride>;
  /** personaId → 온보딩 완료 여부(FR-ON-09). */
  onboardingFinalized: Record<string, boolean>;
  /** 관리자가 편집해 저장한 키워드 가중치. null이면 기본 rule_weights를 사용한다. */
  ruleWeightOverrides: RuleWeight[] | null;
  /** 딜소싱 폼으로 등록해 사용자 상태에 저장한 딜(FR-DS-01). */
  registeredDeals: DealRoom[];
  /** M1: personaId → 온보딩 확정 산출물(Need/Offer/매칭동의). 매칭엔진이 시드 위에 겹쳐 읽는다. */
  onboardingResults: Record<string, OnboardingResult>;
  /** 공개 온보딩 문서를 KURE로 재임베딩한 회원 공간. persona별 최신 결과만 보존한다. */
  memberEmbeddingShadows: Record<string, MemberEmbeddingShadow>;

  setRecommendationOverride: (
    recId: string,
    patch: RecommendationOverride,
  ) => void;
  finalizeOnboardingFor: (personaId: string) => void;
  storeOnboardingResult: (personaId: string, result: OnboardingResult) => void;
  setMemberEmbeddingShadow: (
    personaId: string,
    shadow: MemberEmbeddingShadow,
  ) => void;
  setRuleWeightOverrides: (weights: RuleWeight[]) => void;
  addRegisteredDeal: (deal: DealRoom) => void;
  hydrate: (state: Partial<SessionInteractionSnapshot>) => void;
  reset: () => void;
}

export type SessionInteractionSnapshot = Pick<
  SessionInteractionStore,
  | "recommendationOverrides"
  | "onboardingFinalized"
  | "ruleWeightOverrides"
  | "registeredDeals"
  | "onboardingResults"
  | "memberEmbeddingShadows"
>;

const INITIAL_STATE: SessionInteractionSnapshot = {
  recommendationOverrides: {},
  onboardingFinalized: {},
  ruleWeightOverrides: null,
  registeredDeals: [],
  onboardingResults: {},
  memberEmbeddingShadows: {},
};

export const useSessionInteractionStore = create<SessionInteractionStore>()(
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
        onboardingResults: {
          ...state.onboardingResults,
          [personaId]: result,
        },
      })),
    setMemberEmbeddingShadow: (personaId, shadow) =>
      set((state) => ({
        memberEmbeddingShadows: {
          ...state.memberEmbeddingShadows,
          [personaId]: shadow,
        },
      })),
    setRuleWeightOverrides: (weights) => set({ ruleWeightOverrides: weights }),
    addRegisteredDeal: (deal) =>
      set((state) => ({ registeredDeals: [...state.registeredDeals, deal] })),
    hydrate: (state) => set({ ...INITIAL_STATE, ...state }),
    reset: () => set(INITIAL_STATE),
  }),
);
