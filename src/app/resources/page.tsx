// 자원검색 라우트 — 프로젝트를 지원하는 정책사업 검색(FR-RS-01/02, v1.1 신규 3단계 화면).
// 근거: ARCHITECTURE.md §3(L2, v1.1 신규 9종 중 1) · §5.2 searchOpportunities

import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-6 px-[30px] py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          자원검색
        </h1>
        <AutomationLevelBadge frId="FR-RS-01" />
      </div>
      <p className="max-w-2xl text-sm text-guud-text-muted-2">
        프로젝트를 지원하는 정책사업 공고를 분야·지역·컨소시엄 요건으로 찾고,
        내가 제안한 딜과 분야가 겹치는 공고는 "이 공고, 이 팀이면 가능합니다"
        매칭으로 함께 보여줍니다.
      </p>
      <ResourceSearch />
    </div>
  );
}
