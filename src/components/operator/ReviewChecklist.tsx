"use client";

// ReviewChecklist — 검수 체크리스트 6항목. 운영자가 직접 확인하는 수동 게이트라 계산되지 않고
// 로컬 상태로만 관리한다(승인 버튼은 6항목 전부 체크돼야 활성화).
// 근거: ARCHITECTURE.md §3(L2 ReviewQueueDashboard), TASKS.md T-015, FR-OP-02

import { useId, useState } from "react";

const CHECKLIST_ITEMS = [
  "접점이 원문 인용인가(BR-02)",
  "받는사람 이익이 먼저인가(BR-06)",
  "첫 행동이 구체적으로 특정됐는가",
  "비공개 수요는 최소 노출로만 인용됐는가(FR-RC-06)",
  "A→B/B→A 양쪽이 개별 작성됐는가(FR-RC-07)",
  "공공·중간지원 대상은 1:1이 아닌 모듬인가(FR-RC-08)",
] as const;

export function ReviewChecklist({
  onAllCheckedChange,
}: {
  onAllCheckedChange: (allChecked: boolean) => void;
}) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    new Array(CHECKLIST_ITEMS.length).fill(false),
  );
  const groupId = useId();

  function toggle(index: number) {
    const next = [...checked];
    next[index] = !next[index];
    setChecked(next);
    onAllCheckedChange(next.every(Boolean));
  }

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-semibold text-guud-text-muted-2">
        검수 체크리스트
      </legend>
      {CHECKLIST_ITEMS.map((item, index) => {
        const inputId = `${groupId}-${index}`;
        return (
          <label
            key={item}
            htmlFor={inputId}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <input
              id={inputId}
              type="checkbox"
              checked={checked[index]}
              onChange={() => toggle(index)}
              className="mt-0.5"
            />
            {item}
          </label>
        );
      })}
    </fieldset>
  );
}
