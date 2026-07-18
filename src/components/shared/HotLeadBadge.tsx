// HotLeadBadge — 핫리드 48h 강조. guud "레드는 강조만" 원칙에 부합하는 정당한 사용처(작은 pill).
// 근거: ARCHITECTURE.md §3(L3), TASKS.md T-008, FR-OP-03, guud DESIGN.md Do's/Don'ts

import { Badge } from "@/components/ui/badge";

export function HotLeadBadge() {
  return (
    <Badge className="rounded-full bg-destructive/10 px-2.5 py-0.5 font-semibold tracking-normal text-destructive normal-case">
      핫리드 · 48시간 내 확인
    </Badge>
  );
}
