// AssumptionBadge — 가정치 뱃지. "달성" 오인 방지를 위해 KPI 카드 등에 병기(FR-KP-03, BR-09).
// 근거: ARCHITECTURE.md §3(L3), TASKS.md T-008/T-016
// 채움 배경 대신 테두리만 써서 guud badge-new(amber) 토큰의 대비 미달(Known Gaps)을 피한다.

import { Badge } from "@/components/ui/badge";

export function AssumptionBadge() {
  return (
    <Badge className="rounded-full border border-guud-badge-new px-2.5 py-0.5 font-semibold tracking-normal text-foreground normal-case">
      가정치
    </Badge>
  );
}
