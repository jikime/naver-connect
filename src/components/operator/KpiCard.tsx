// KpiCard — 목표선/현재선 구분 미터 + 가정치 뱃지("달성" 오인 방지, FR-KP-03/BR-09).
// 근거: ARCHITECTURE.md §3(L2 KpiDash), TASKS.md T-016, FR-KP-01/02/03
// Task #21: 게이지 바가 목표 폭까지 채워지고 현재 수치가 카운트업된다(가정치 뱃지는 정적 유지 —
// "달성"으로 착시되지 않도록 애니메이션을 주지 않는다, BR-09).

import { motion } from "motion/react";
import { AssumptionBadge } from "@/components/shared/AssumptionBadge";
import { CountUp } from "@/components/shared/CountUp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/types";

export function KpiCard({
  kpi,
  highlight = false,
}: {
  kpi: Kpi;
  highlight?: boolean;
}) {
  const scaleMax = Math.max(kpi.target, kpi.current) * 1.15 || 1;
  const currentPct = Math.min(100, (kpi.current / scaleMax) * 100);
  const targetPct = Math.min(100, (kpi.target / scaleMax) * 100);
  const achieved = kpi.current >= kpi.target;

  return (
    <Card
      className={
        highlight
          ? "h-full border-transparent bg-primary text-primary-foreground"
          : "h-full"
      }
    >
      <CardHeader>
        {/* ④ 지표 라벨을 mono eyebrow로 */}
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className={cn(
              "font-mono text-[0.625rem] font-medium tracking-[0.14em] uppercase",
              highlight
                ? "text-primary-foreground/80"
                : "text-guud-text-muted-2",
            )}
          >
            {kpi.label}
          </CardTitle>
          {kpi.is_assumption && <AssumptionBadge />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ④ 핵심 수치를 display 계열 큰 타이포로 */}
        <p className="flex items-baseline gap-1 font-heading text-4xl font-light tracking-tight">
          <CountUp value={kpi.current} />
          <span className="text-lg font-normal">{kpi.unit}</span>
        </p>
        <div
          className={cn(
            "relative h-2 w-full rounded-full",
            highlight ? "bg-primary-foreground/25" : "bg-muted",
          )}
        >
          <motion.div
            className={cn(
              "h-full rounded-full",
              highlight ? "bg-primary-foreground" : "bg-primary",
            )}
            initial={{ width: 0 }}
            animate={{ width: `${currentPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <div
            className={cn(
              "absolute inset-y-0 w-0.5",
              highlight ? "bg-foreground/70" : "bg-foreground",
            )}
            style={{ left: `${targetPct}%` }}
            title={`목표선: ${kpi.target}${kpi.unit}`}
          />
        </div>
        <div
          className={cn(
            "flex items-center justify-between font-mono text-[0.625rem] tracking-[0.1em] uppercase",
            highlight ? "text-primary-foreground/80" : "text-guud-text-muted-2",
          )}
        >
          <span>
            목표 {kpi.target}
            {kpi.unit}
          </span>
          <span>{achieved ? "목표선 도달(가정치)" : "목표선 미도달"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
