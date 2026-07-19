"use client";

// FinanceServiceSearch — 금융기관/상품 제안 + 직접 검색·연락(FR-FN-01/02).
// 근거: ARCHITECTURE.md §5.2 getFinancialProducts, FR-FN-01~03

import { useEffect, useMemo, useState } from "react";
import { FinancialProductCard } from "@/components/finance/FinancialProductCard";
import { Input } from "@/components/ui/input";
import { getFinancialProducts } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { useViewerContext } from "@/stores/viewer-context";
import type { FinancialProduct } from "@/types";

const ALL = "전체";

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-muted text-guud-text-muted-2",
      )}
    >
      {label}
    </button>
  );
}

export function FinanceServiceSearch() {
  const vc = useViewerContext();
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<string>(ALL);
  const [region, setRegion] = useState<string>(ALL);
  const [all, setAll] = useState<FinancialProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFinancialProducts(vc).then((result) => {
      if (!cancelled) {
        setAll(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vc]);

  const typeOptions = useMemo(
    () => [ALL, ...Array.from(new Set((all ?? []).map((p) => p.type)))],
    [all],
  );
  const regionOptions = useMemo(
    () => [ALL, ...Array.from(new Set((all ?? []).map((p) => p.region)))],
    [all],
  );

  const filtered = (all ?? []).filter((product) => {
    if (type !== ALL && product.type !== type) {
      return false;
    }
    if (region !== ALL && product.region !== region) {
      return false;
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      const haystack =
        `${product.institution} ${product.product_name} ${product.conditions}`.toLowerCase();
      if (!haystack.includes(kw)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <Input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="키워드로 검색 (예: 임팩트투자, 보증, 신협)"
          aria-label="금융기관/상품 키워드 검색"
        />
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="상품 유형 필터"
        >
          {typeOptions.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={type === option}
              onClick={() => setType(option)}
            />
          ))}
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="지역 필터"
        >
          {regionOptions.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={region === option}
              onClick={() => setRegion(option)}
            />
          ))}
        </div>
      </section>
      {all === null ? (
        <p className="text-sm text-guud-text-muted-2">
          금융상품을 불러오는 중입니다…
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-guud-text-muted-2">
          조건에 맞는 금융상품이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <FinancialProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
