// ExpertServiceCard — 전문가 서비스 카드. 자격·경험 배지·후기 요약·공시 단가 범위(FR-BO-02).
// 근거: ARCHITECTURE.md §3(L2 BackOffice), TASKS.md T-021

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpertService } from "@/types";

export function ExpertServiceCard({ service }: { service: ExpertService }) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm normal-case tracking-normal">
            {service.category}
          </CardTitle>
          <Badge className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-semibold tracking-normal text-foreground normal-case">
            {service.profile_badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <p className="text-xs text-guud-text-muted-2">
          {service.certification}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {service.experience_tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-guud-hairline bg-guud-surface-alt-2 px-2 py-0.5 text-xs text-guud-text-muted-2"
            >
              {tag}
            </span>
          ))}
        </div>
        <ul className="flex flex-col gap-1 border-t border-guud-hairline pt-2 text-xs">
          {service.service_catalog.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-foreground">{item.name}</span>
              <span className="text-guud-text-muted-2">{item.price_range}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-guud-text-subtle">
          {service.reviews_summary}
        </p>
        <p className="text-xs text-guud-text-muted-2">
          재계약률 {Math.round(service.recontract_rate * 100)}%
        </p>
        <p className="border-t border-guud-hairline pt-2 text-xs text-guud-text-faint">
          {service.coi_disclosure}
        </p>
      </CardContent>
    </Card>
  );
}
