// ViewerContext 스토어 — Auth.js 세션에서 동기화한 현재 역할·페르소나의 화면 캐시.
// 근거: ARCHITECTURE.md §3(L4)·§7 ADR-01, TASKS.md T-006
// 사용자가 역할·페르소나를 임의 전환하지 않으며 AppAccessGate만 인증 세션 값으로 갱신한다.

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { ViewerContext } from "@/types";

/** 로그아웃 상태에서 사용하는 중립 초기값. 로그인 뒤에는 즉시 인증 세션 값으로 교체된다. */
export const INITIAL_VIEWER_CONTEXT: ViewerContext = {
  role: "기업가",
  personaId: "M-001",
};

interface ViewerContextStore extends ViewerContext {
  /** Auth.js 세션의 역할과 페르소나를 함께 반영한다. */
  setViewer: (next: Pick<ViewerContext, "role" | "personaId">) => void;
  reset: () => void;
}

export const useViewerContextStore = create<ViewerContextStore>((set) => ({
  ...INITIAL_VIEWER_CONTEXT,
  setViewer: ({ role, personaId }) => set({ role, personaId }),
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
