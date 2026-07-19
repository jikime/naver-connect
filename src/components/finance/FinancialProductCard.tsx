// FinancialProductCard — 금융기관/상품 1건 카드(FR-FN-01/02/03). financial_products.json은
// [창작 목업](A10) — AssumptionBadge로 실데이터 오인을 방지한다.
// 근거: ARCHITECTURE.md §5.2 getFinancialProducts, FR-FN-01~03, OQ-02(신협 법률검토 미완 시 확정 차단)

import { AssumptionBadge } from "@/components/shared/AssumptionBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFieldName } from "@/lib/dal";
import { cn } from "@/lib/utils";
import type { FinancialProduct } from "@/types";

const LEGAL_STATUS_STYLE: Record<
  FinancialProduct["legal_review_status"],
  string
> = {
  완료: "bg-primary text-primary-foreground",
  검토중: "border border-foreground text-foreground bg-background",
  미착수: "border border-guud-text-faint text-guud-text-muted-2 bg-background",
};

export function FinancialProductCard({
  product,
}: {
  product: FinancialProduct;
}) {
  const fieldNames = product.field_tags
    .map((id) => getFieldName(id))
    .filter((name): name is string => Boolean(name));

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm normal-case tracking-normal">
            {product.institution}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-semibold tracking-normal text-foreground normal-case">
              {product.type}
            </Badge>
            <AssumptionBadge />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-xs">
        <p className="text-sm font-semibold text-foreground">
          {product.product_name}
        </p>
        {fieldNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {fieldNames.map((name) => (
              <span
                key={name}
                className="rounded-full border border-guud-hairline bg-guud-surface-alt-2 px-2 py-0.5 text-guud-text-muted-2"
              >
                {name}
              </span>
            ))}
          </div>
        )}
        <p className="text-guud-text-muted-2">
          단계: {product.stage_hint} · 지역: {product.region}
        </p>
        <p className="text-guud-text-subtle">{product.conditions}</p>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-guud-hairline pt-2">
          <Badge
            className={cn(
              "rounded-full px-2.5 py-0.5 font-semibold tracking-normal normal-case",
              LEGAL_STATUS_STYLE[product.legal_review_status],
            )}
          >
            법률 검토 {product.legal_review_status}
          </Badge>
          {product.legal_review_status !== "완료" && (
            <span className="text-guud-text-faint">
              검토 완료 전에는 상품 확정·계약을 진행하지 않습니다.
            </span>
          )}
        </div>
        <p className="border border-dashed border-guud-text-faint px-2 py-1.5 text-guud-text-muted-2">
          연락처: {product.contact}
        </p>
      </CardContent>
    </Card>
  );
}
