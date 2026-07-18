"use client";

// KpiDashboard — 1단계 KPI 6종 카드. getKpis(T-004)가 shown_in_mvp 필터를 이미 적용하므로
// 이 컴포넌트는 렌더만 담당하고 2·3단계 KPI를 걸러내는 로직을 다시 두지 않는다(T-016 Self-check).
// 근거: ARCHITECTURE.md §3(L2 KpiDash), TASKS.md T-016, FR-KP-01~03, §14/M-3

import { useEffect, useState } from "react";
import { getKpis } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { Kpi } from "@/types";
import { KpiCard } from "./KpiCard";

export function KpiDashboard() {
  const vc = useViewerContext();
  const [kpis, setKpis] = useState<Kpi[] | null>(null);

  useEffect(() => {
    getKpis(vc).then(setKpis);
  }, [vc]);

  if (kpis === null) {
    return (
      <p className="px-[30px] py-6 text-sm text-guud-text-muted-2">
        KPI를 불러오는 중입니다…
      </p>
    );
  }

  return (
    <div className="grid gap-4 px-[30px] py-6 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
