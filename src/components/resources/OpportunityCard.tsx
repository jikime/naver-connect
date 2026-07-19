// OpportunityCard — 정책사업 공고 1건 카드(FR-RS-01). opportunities.json(v1.0 실문서 근거)을 그대로 렌더.
// 근거: ARCHITECTURE.md §5.2 searchOpportunities, TASKS.md 승계 FR-GR-05/FR-RS-01/02

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Opportunity } from "@/types";

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm normal-case tracking-normal">
            {opportunity.source}
          </CardTitle>
          <Badge className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-semibold tracking-normal text-foreground normal-case">
            {opportunity.field}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-xs">
        <p className="text-sm text-foreground">
          {opportunity.target_requirement}
        </p>
        <p className="text-guud-text-muted-2">지역: {opportunity.region}</p>
        <p className="text-guud-text-muted-2">
          마감: {opportunity.deadline} · 규모: {opportunity.budget_scale}
        </p>
        <p className="text-guud-text-subtle">
          {opportunity.consortium_required
            ? "컨소시엄 구성 필요"
            : "단독 지원 가능"}
        </p>
      </CardContent>
    </Card>
  );
}
