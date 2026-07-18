// 운영자 검수 대시보드 라우트 — 정적 헤더는 Server Component, 큐·승인/반려는 Client 위임(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /operator/review), TASKS.md T-015, FR-OP-01~04, BR-05

import { ReviewQueueDashboard } from "@/components/operator/ReviewQueueDashboard";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function OperatorReviewPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-guud-hairline px-[30px] py-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            운영자 검수
          </h1>
          <p className="mt-1 text-sm text-guud-text-muted-2">
            생성된 추천 전건을 검수하고 승인/반려합니다(BR-05).
          </p>
        </div>
        <AutomationLevelBadge frId="FR-OP-01" />
      </div>
      <ReviewQueueDashboard />
    </div>
  );
}
