// BusinessRelationSession 스토어 — v1.1 2단계(생태계맵 v2·협업사례·제안 트래킹) 세션 쓰기.
// 근거: ARCHITECTURE.md §5.3 "v1.1 쓰기 경계(C-3·A8 개정)" — 이 스토어의 쓰기는 전부
// 세션 한정이며 실제 백엔드 쓰기가 없고 새로고침 시 리셋된다(A6와 동일 원칙).
// FR-EM2-03(setMyOrgs)·FR-CS-01(inputCollabCase)·FR-PP-02(trackProposal)가 이 스토어를 쓴다.
//
// 기존 session-interaction.ts(추천/온보딩 세션)와 분리된 별도 스토어다 — v1.1 3개 구현
// 단계(1/2/3단계)가 동시에 각자의 세션 쓰기를 추가하는 중이라, 도메인별로 스토어 파일을
// 나눠 편집 충돌을 줄인다(2단계 전용 상태만 여기 둔다).

import { create } from "zustand";
import type { CollabCase, ProjectProposal } from "@/types";

interface MyOrgsSetting {
  affiliationOrgId: string | null;
  targetOrgIds: string[];
}

interface BusinessRelationSessionStore {
  /** personaId → "내 소속/대상 단체" 세션 오버라이드(FR-EM2-03). 없으면 시드 기본값 사용. */
  myOrgsOverrides: Record<string, MyOrgsSetting>;
  /** 이번 세션에 입력된 신규 협업 사례(FR-CS-01). */
  addedCollabCases: CollabCase[];
  /** proposalId → 세션 중 변경된 트래킹 상태(FR-PP-02). */
  proposalStatusOverrides: Record<string, ProjectProposal["track_status"]>;

  setMyOrgs: (personaId: string, setting: MyOrgsSetting) => void;
  addCollabCase: (collabCase: CollabCase) => void;
  setProposalStatus: (
    proposalId: string,
    status: ProjectProposal["track_status"],
  ) => void;
  reset: () => void;
}

const INITIAL_STATE: Pick<
  BusinessRelationSessionStore,
  "myOrgsOverrides" | "addedCollabCases" | "proposalStatusOverrides"
> = {
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
    reset: () => set(INITIAL_STATE),
  }));
