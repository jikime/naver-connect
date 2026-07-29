// BusinessRelationSession 스토어 — 생태계·협업사례·제안 상태의 화면 반응용 캐시.
// 정본은 ax_private.user_runtime_states이며 API 저장 후 이 캐시를 다시 수화한다.
// FR-EM2-03(setMyOrgs)·FR-CS-01(inputCollabCase)·FR-PP-02(trackProposal)가 이 스토어를 쓴다.
//
// 기존 session-interaction.ts(추천/온보딩 세션)와 분리된 별도 스토어다 — v1.1 3개 구현
// 단계(1/2/3단계)가 동시에 각자의 세션 쓰기를 추가하는 중이라, 도메인별로 스토어 파일을
// 나눠 편집 충돌을 줄인다(2단계 전용 상태만 여기 둔다).

import { create } from "zustand";
import type { CollabCase, ProjectProposal } from "@/types";

export interface MyOrgsSetting {
  affiliationOrgId: string | null;
  targetOrgIds: string[];
}

export interface BusinessRelationSessionStore {
  /** personaId → "내 소속/대상 단체" 사용자 오버라이드(FR-EM2-03). */
  myOrgsOverrides: Record<string, MyOrgsSetting>;
  /** 사용자가 입력해 DB 상태에 저장한 신규 협업 사례(FR-CS-01). */
  addedCollabCases: CollabCase[];
  /** proposalId → 저장된 트래킹 상태(FR-PP-02). */
  proposalStatusOverrides: Record<string, ProjectProposal["track_status"]>;

  setMyOrgs: (personaId: string, setting: MyOrgsSetting) => void;
  addCollabCase: (collabCase: CollabCase) => void;
  setProposalStatus: (
    proposalId: string,
    status: ProjectProposal["track_status"],
  ) => void;
  hydrate: (state: Partial<BusinessRelationSnapshot>) => void;
  reset: () => void;
}

export type BusinessRelationSnapshot = Pick<
  BusinessRelationSessionStore,
  "myOrgsOverrides" | "addedCollabCases" | "proposalStatusOverrides"
>;

const INITIAL_STATE: BusinessRelationSnapshot = {
  myOrgsOverrides: {},
  addedCollabCases: [],
  proposalStatusOverrides: {},
};

export const useBusinessRelationSessionStore =
  create<BusinessRelationSessionStore>((set) => ({
    ...INITIAL_STATE,
    setMyOrgs: (personaId, setting) =>
      set((state) => ({
        myOrgsOverrides: { ...state.myOrgsOverrides, [personaId]: setting },
      })),
    addCollabCase: (collabCase) =>
      set((state) => ({
        addedCollabCases: [...state.addedCollabCases, collabCase],
      })),
    setProposalStatus: (proposalId, status) =>
      set((state) => ({
        proposalStatusOverrides: {
          ...state.proposalStatusOverrides,
          [proposalId]: status,
        },
      })),
    hydrate: (state) => set({ ...INITIAL_STATE, ...state }),
    reset: () => set(INITIAL_STATE),
  }));
