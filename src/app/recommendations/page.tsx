// 주간 추천 리스트 라우트 — 정적 헤더는 Server Component, 데이터·인터랙션은 Client 위임(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /recommendations), FR-RC-01/02/08, FR-GL-04
// v1.1 개편(FR-RC-01): 공통점 5명 + 차이점 5명 구분 제시, 각 그룹 더보기로 최대 15명까지.

import { WeeklyRecommendationList } from "@/components/recommendations/WeeklyRecommendationList";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function RecommendationsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-6 py-14 sm:px-10 lg:px-16">
          <div className="space-y-3">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ WEEKLY MATCHES ]
            </p>
            <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              이번 주 <span className="text-primary">추천</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
              공통점이 많은 회원 5명과 차이점이 많은 회원 5명을 구분해 보여줘요 —
              각 그룹은 더보기로 최대 15명까지 볼 수 있어요.
            </p>
          </div>
          <AutomationLevelBadge frId="FR-RC-01" />
        </div>
      </header>
      <WeeklyRecommendationList />
    </div>
  );
}
