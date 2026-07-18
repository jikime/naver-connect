// VisibilityGate — 마스킹 2차 방어 UI. DAL이 이미 private를 null로 치환했으므로(ADR-03) 여기서는
// null일 때 "비공개" 표기로 안내만 한다(방어의 1차 지점은 DAL visibilityMask).
// 근거: ARCHITECTURE.md §3(L3)·§7 ADR-03, TASKS.md T-008, FR-GL-02/03

import type { ReactNode } from "react";

export function VisibilityGate<T>({
  value,
  children,
  fallbackLabel = "비공개",
}: {
  value: T | null;
  children: (value: T) => ReactNode;
  fallbackLabel?: string;
}) {
  if (value === null) {
    return (
      <span className="inline-flex items-center border border-dashed border-guud-text-faint px-2 py-1 text-xs text-guud-text-muted-2">
        {fallbackLabel}
      </span>
    );
  }
  return <>{children(value)}</>;
}
