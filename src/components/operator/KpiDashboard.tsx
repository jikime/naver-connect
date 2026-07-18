"use client";

// KpiDashboard — 1단계 KPI 6종 카드. getKpis(T-004)가 shown_in_mvp 필터를 이미 적용하므로
// 이 컴포넌트는 렌더만 담당하고 2·3단계 KPI를 걸러내는 로직을 다시 두지 않는다(T-016 Self-check).
// 근거: ARCHITECTURE.md §3(L2 KpiDash), TASKS.md T-016, FR-KP-01~03, §14/M-3

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { getKpis } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { Kpi } from "@/types";
import { KpiCard } from "./KpiCard";

// Task #21: 카드 리스트 스태거 진입 — 항목당 60ms 지연(6장 기준 최대 300ms대), 개별
// 트랜지션은 120ms 이내로 짧게 유지해 일괄 fade처럼 보이지 않게 한다.
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.12 } },
};

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 px-[30px] py-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {kpis.map((kpi) => (
        <motion.div key={kpi.id} variants={item}>
          <KpiCard kpi={kpi} />
        </motion.div>
      ))}
    </motion.div>
  );
}
