// ExpertServiceCatalog — 전문가 서비스 카드 리스트 + 카테고리 필터(FR-BO-01/02).
// 근거: ARCHITECTURE.md §3(L2 BackOffice), TASKS.md T-021
// 필터 선택 상태만 클라이언트에서 유지하는 정적 스텁(정산·거래 실기능 없음, Out of Scope).

"use client";

import { useMemo, useState } from "react";
import { ExpertServiceCard } from "@/components/backoffice/ExpertServiceCard";
import { cn } from "@/lib/utils";
import type { ExpertService } from "@/types";

const ALL = "전체";

export function ExpertServiceCatalog({
  services,
}: {
  services: ExpertService[];
}) {
  const categories = useMemo(
    () => [
      ALL,
      ...Array.from(new Set(services.map((service) => service.category))),
    ],
    [services],
  );
  const [selected, setSelected] = useState<string>(ALL);

  const filtered =
    selected === ALL
      ? services
      : services.filter((service) => service.category === selected);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-foreground">
          전문가 서비스 카탈로그
        </h2>
        <span className="text-xs text-guud-text-muted-2">
          {filtered.length}건
        </span>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="카테고리 필터"
      >
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={selected === category}
            onClick={() => setSelected(category)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              selected === category
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-muted text-guud-text-muted-2",
            )}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((service) => (
          <ExpertServiceCard key={service.expert_id} service={service} />
        ))}
      </div>
    </section>
  );
}
