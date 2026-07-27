// 자원검색 라우트 — 프로젝트를 지원하는 정책사업 검색(FR-RS-01/02, v1.1 신규 3단계 화면).
// 근거: ARCHITECTURE.md §3(L2, v1.1 신규 9종 중 1) · §5.2 searchOpportunities

import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function ResourcesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-6 py-14 sm:px-10 lg:px-16">
          <div className="space-y-3">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ RESOURCE SEARCH ]
            </p>
            <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              자원 <span className="text-primary">검색</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
              프로젝트를 지원하는 정책사업 공고를 분야·지역·컨소시엄 요건으로
              찾고, 내가 제안한 딜과 분야가 겹치는 공고는 "이 공고, 이 팀이면
              가능합니다" 매칭으로 함께 보여줍니다.
            </p>
          </div>
          <AutomationLevelBadge frId="FR-RS-01" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
        <ResourceSearch />
      </div>
    </div>
  );
}
