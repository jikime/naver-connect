// 1단계 KPI 대시보드 라우트 — 정적 헤더는 Server Component, 카드 데이터는 Client 위임(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /operator/kpi), TASKS.md T-016, FR-KP-01~03, §14/M-3

import { KpiDashboard } from "@/components/operator/KpiDashboard";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function OperatorKpiPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ④ 헤더 밴드(canvas): mono eyebrow + headline 1점 강조 — home KPI 아키타입 */}
      <section className="border-b border-guud-hairline bg-background py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
                [ OPERATOR · STAGE 01 KPI ]
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
                1단계 <span className="text-primary">KPI</span>
              </h1>
              <p className="text-sm text-guud-text-muted-2">
                파일럿 1단계 6종 지표입니다. 표시값은 전부 가정치이며 “달성”을
                의미하지 않습니다(BR-09). 2·3단계 KPI는 이번 목업 범위 밖입니다.
              </p>
            </div>
            <AutomationLevelBadge frId="FR-KP-01" />
          </div>
        </div>
      </section>
      {/* ④ 지표 밴드(muted): canvas 헤더와 교차 */}
      <section className="flex-1 bg-muted py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
          <KpiDashboard />
        </div>
      </section>
    </div>
  );
}
