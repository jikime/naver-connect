// 1단계 KPI 대시보드 라우트 — 정적 헤더는 Server Component, 카드 데이터는 Client 위임(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /operator/kpi), TASKS.md T-016, FR-KP-01~03, §14/M-3

import { KpiDashboard } from "@/components/operator/KpiDashboard";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function OperatorKpiPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-guud-hairline px-[30px] py-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            1단계 KPI
          </h1>
          <p className="mt-1 text-sm text-guud-text-muted-2">
            파일럿 1단계 6종 지표입니다. 표시값은 전부 가정치이며 “달성”을
            의미하지 않습니다(BR-09). 2·3단계 KPI는 이번 목업 범위 밖입니다.
          </p>
        </div>
        <AutomationLevelBadge frId="FR-KP-01" />
      </div>
      <KpiDashboard />
    </div>
  );
}
