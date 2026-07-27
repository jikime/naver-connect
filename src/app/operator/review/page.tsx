// 운영자 검수 대시보드 라우트 — 정적 헤더는 Server Component, 큐·승인/반려는 Client 위임(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /operator/review), TASKS.md T-015, FR-OP-01~04, BR-05

import { ReviewQueueDashboard } from "@/components/operator/ReviewQueueDashboard";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function OperatorReviewPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-6 py-14 sm:px-10 lg:px-16">
          <div className="space-y-3">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ OPERATOR REVIEW ]
            </p>
            <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              운영자 <span className="text-primary">검수</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
              생성된 추천 전건을 검수하고 승인/반려합니다(BR-05).
            </p>
          </div>
          <AutomationLevelBadge frId="FR-OP-01" />
        </div>
      </header>
      <ReviewQueueDashboard />
    </div>
  );
}
