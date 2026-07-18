// 주간 추천 리스트 라우트 — 정적 헤더는 Server Component, 데이터·인터랙션은 Client 위임(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /recommendations), TASKS.md T-012, FR-RC-01/02/08, FR-GL-04

import { WeeklyRecommendationList } from "@/components/recommendations/WeeklyRecommendationList";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function RecommendationsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-guud-hairline px-[30px] py-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            이번 주 추천
          </h1>
          <p className="mt-1 text-sm text-guud-text-muted-2">
            사업가치·동료성장가치·관계가치가 섞인 3장 — 핫리드는 퍼즐형이 먼저
            옵니다.
          </p>
        </div>
        <AutomationLevelBadge frId="FR-RC-01" />
      </div>
      <WeeklyRecommendationList />
    </div>
  );
}
