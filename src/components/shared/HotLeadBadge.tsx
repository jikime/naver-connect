// HotLeadBadge — 핫리드 48h 강조. guud "레드는 강조만" 원칙에 부합하는 정당한 사용처(작은 pill).
// 근거: ARCHITECTURE.md §3(L3), TASKS.md T-008, FR-OP-03, guud DESIGN.md Do's/Don'ts
// 모드 B 회송: bg-destructive/10 + text-destructive는 3.06:1로 AA 미달 — AssumptionBadge와
// 동일하게 테두리만 destructive를 쓰고 텍스트는 text-foreground(21:1)로 교체.

import { Badge } from "@/components/ui/badge";

export function HotLeadBadge() {
  return (
    <Badge className="rounded-full border border-destructive px-2.5 py-0.5 font-semibold tracking-normal text-foreground normal-case">
      핫리드 · 48시간 내 확인
    </Badge>
  );
}
