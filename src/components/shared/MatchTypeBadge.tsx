// MatchTypeBadge — 매칭유형 5종(거울/퍼즐/다리/취미/선배) 뱃지. 텍스트 라벨 병기(색만 의존 금지).
// 근거: ARCHITECTURE.md §3(L3), TASKS.md T-008, FR-RC-04, NFR-05/§18
// 형태 이중성: pill(rounded-full). 5종 모두 동일한 중립 톤 — guud 팔레트에 5색 시맨틱이 없어
// off-system 색을 새로 만들지 않고 텍스트 라벨만으로 구분한다(레드는 핫리드 전용, HotLeadBadge 참조).

import { Badge } from "@/components/ui/badge";
import type { MatchType } from "@/types";

export function MatchTypeBadge({ type }: { type: MatchType }) {
  return (
    <Badge className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-semibold tracking-normal text-foreground normal-case">
      {type}
    </Badge>
  );
}
