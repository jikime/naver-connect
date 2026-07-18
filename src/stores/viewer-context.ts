// ViewerContext 스토어 — 현재 역할·페르소나. 전 화면 가시성의 단일 입력(FR-GL-01).
// 근거: ARCHITECTURE.md §3(L4)·§7 ADR-01, TASKS.md T-006
// persist 미들웨어를 쓰지 않는다 — 새로고침 시 초기 페르소나로 리셋되는 것이 의도(A6).

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { ViewerContext } from "@/types";

/** 8인 페르소나 중 초기 뷰어(FR-ON-01 기준 첫 번째 기업가). 운영자 role일 때도 최근 personaId를 보존한다. */
export const INITIAL_VIEWER_CONTEXT: ViewerContext = {
  role: "기업가",
  personaId: "M-001",
};

/**
 * 운영자 role의 personaId placeholder. 8인 페르소나는 모두 기업가/전문가이며
 * 운영자에 대응하는 회원 레코드가 없다(검수·발행·KPI 뷰는 인물이 아닌 역할). isPrivilegedViewer는
 * role==='운영자'만으로 이미 판정하므로 이 값 자체가 실제 member_id와 매칭될 필요는 없다.
 */
export const OPERATOR_PERSONA_ID = "OPERATOR";

interface ViewerContextStore extends ViewerContext {
  /** 역할+페르소나를 함께 전환(RoleSwitcher가 호출). */
  setViewer: (next: Pick<ViewerContext, "role" | "personaId">) => void;
  /** 역할만 전환(페르소나는 유지 — 운영자 시점 전환 등). */
  setRole: (role: ViewerContext["role"]) => void;
  /** 페르소나만 전환(역할은 유지). */
  setPersonaId: (personaId: string) => void;
  reset: () => void;
}

export const useViewerContextStore = create<ViewerContextStore>((set) => ({
  ...INITIAL_VIEWER_CONTEXT,
  setViewer: ({ role, personaId }) => set({ role, personaId }),
  setRole: (role) => set({ role }),
  setPersonaId: (personaId) => set({ personaId }),
  reset: () => set(INITIAL_VIEWER_CONTEXT),
}));

/**
 * 컴포넌트에서 DAL 호출용 ViewerContext만 뽑아 쓰는 selector.
 * zustand v5의 useStore는 v4와 달리 selector 결과를 자동 메모이즈하지 않는다(useSyncExternalStoreWithSelector
 * 미사용, react.js 참조) — 매 렌더 새 객체를 반환하는 selector는 getSnapshot 결과가 매번 달라져
 * "Maximum update depth exceeded"/"getServerSnapshot should be cached" 무한 렌더 루프를 유발한다.
 * useShallow로 얕은 비교 후 이전 참조를 재사용해 참조 안정성을 보장한다.
 */
export function useViewerContext(): ViewerContext {
  return useViewerContextStore(
    useShallow((state) => ({
      role: state.role,
      personaId: state.personaId,
    })),
  );
}
