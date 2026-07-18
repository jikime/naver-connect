// KpiCard — 목표선/현재선 구분 미터 + 가정치 뱃지("달성" 오인 방지, FR-KP-03/BR-09).
// 근거: ARCHITECTURE.md §3(L2 KpiDash), TASKS.md T-016, FR-KP-01/02/03
// Task #21: 게이지 바가 목표 폭까지 채워지고 현재 수치가 카운트업된다(가정치 뱃지는 정적 유지 —
// "달성"으로 착시되지 않도록 애니메이션을 주지 않는다, BR-09).

import { motion } from "motion/react";
import { AssumptionBadge } from "@/components/shared/AssumptionBadge";
import { CountUp } from "@/components/shared/CountUp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Kpi } from "@/types";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const scaleMax = Math.max(kpi.target, kpi.current) * 1.15 || 1;
  const currentPct = Math.min(100, (kpi.current / scaleMax) * 100);
  const targetPct = Math.min(100, (kpi.target / scaleMax) * 100);
  const achieved = kpi.current >= kpi.target;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm normal-case tracking-normal">
            {kpi.label}
          </CardTitle>
          {kpi.is_assumption && <AssumptionBadge />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative h-2 w-full rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${currentPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground"
            style={{ left: `${targetPct}%` }}
            title={`목표선: ${kpi.target}${kpi.unit}`}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-guud-text-muted-2">
          <span>
            현재{" "}
            <strong className="font-semibold text-foreground">
              <CountUp value={kpi.current} />
              {kpi.unit}
            </strong>
          </span>
          <span>
            목표 {kpi.target}
            {kpi.unit}
          </span>
        </div>
        <p className="text-xs text-guud-text-muted-2">
          {achieved ? "목표선 도달(가정치 기준 — 실측 아님)" : "목표선 미도달"}
        </p>
      </CardContent>
    </Card>
  );
}
