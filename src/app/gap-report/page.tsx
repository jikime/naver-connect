// 사업기회 발굴(구 격차 리포트) — 한빛구 셸(FR-GR-01/03) + 연결맵·지역 맵 토글(FR-GR-02/04, T-020)
// + 기회카드(FR-GR-05/06/07) + buying power·협업사례·제안 연결(v1.1 FR-GR-08/09/10).
// 근거: ARCHITECTURE.md §3(L2 GapReport), PRD §8.6, TASKS.md T-017/T-018/T-019/T-020, ADR-02/ADR-04
//
// Server Component로 둔다: getGapReport(region_hanbit) 응답은 역할·페르소나에 따라
// 달라지지 않는 비민감 공개 집계라(마스킹 대상 필드 없음) ADR-04의 "정적·비민감 콘텐츠는
// RSC로 프리렌더" 원칙이 우선 적용된다(layout.tsx의 getMembers 선례와 동일 패턴).
// DAL 계약(ADR-05)상 ViewerContext가 필요하므로 layout.tsx와 동일한 placeholder를 쓰되,
// 회원 이름은 마스킹과 무관한 공개 최상위 필드만 뽑아 내려 private 레이어는 절대
// 클라이언트로 넘기지 않는다. 노드 클릭·CTA·맵 토글 등 실제 인터랙션은 각 리프 컴포넌트에서
// 'use client'로 분리한다(GapEcosystemMapToggle·GapCardCTAs).

import { CoverageSummary } from "@/components/gap-report/CoverageSummary";
import { GapCardList } from "@/components/gap-report/GapCardList";
import { GapEcosystemMapToggle } from "@/components/gap-report/GapEcosystemMapToggle";
import { RegionStatusTable } from "@/components/gap-report/RegionStatusTable";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { getGapReport, getMembers, getProposals } from "@/lib/dal";

const PLACEHOLDER_VIEWER = { role: "기업가", personaId: "M-001" } as const;
const REGION_ID = "R-HANBIT";

export default async function GapReportPage() {
  const [
    { region, stageLinks, orgs, gapCards, collabCases },
    members,
    proposals,
  ] = await Promise.all([
    getGapReport(PLACEHOLDER_VIEWER, REGION_ID),
    getMembers(PLACEHOLDER_VIEWER),
    getProposals(PLACEHOLDER_VIEWER),
  ]);

  // name은 마스킹 대상이 아닌 공개 최상위 필드다 — id+name만 뽑아 내려 private 레이어
  // 누출 여지를 원천 차단한다(ADR-03/§9 R-03).
  const memberNames = new Map(members.map((m) => [m.id, m.name]));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-[30px] py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold text-guud-text-muted-2">
          2단계 · 사업기회 발굴{" "}
          <span className="text-guud-text-faint">(구 격차 리포트)</span>
        </p>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {region.name} 사업기회 발굴
        </h1>
        <p className="max-w-2xl text-sm text-guud-text-muted-2">
          지역 주체 유형별 규모, 연결 커버리지·buying power(구매력), 완전 공백
          축, 과거·진행 중 협업 사례, 그리고 그 공백을 메울 기회 카드를 한
          화면에서 봅니다.
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="region-status-heading">
        <div className="flex items-center gap-2">
          <h2
            id="region-status-heading"
            className="font-heading text-lg font-bold text-foreground"
          >
            지역 현황
          </h2>
          <AutomationLevelBadge frId="FR-GR-01" />
        </div>
        <RegionStatusTable region={region} />
      </section>

      <section className="space-y-3" aria-labelledby="coverage-heading">
        <div className="flex items-center gap-2">
          <h2
            id="coverage-heading"
            className="font-heading text-lg font-bold text-foreground"
          >
            커버리지 요약
          </h2>
          <AutomationLevelBadge frId="FR-GR-03" />
        </div>
        <CoverageSummary region={region} />
      </section>

      <section className="space-y-3" aria-labelledby="connection-map-heading">
        <div className="flex items-center gap-2">
          <h2
            id="connection-map-heading"
            className="font-heading text-lg font-bold text-foreground"
          >
            연결맵 · 지역 맵
          </h2>
          <AutomationLevelBadge frId="FR-GR-02" />
        </div>
        <GapEcosystemMapToggle
          region={region}
          stageLinks={stageLinks}
          orgs={orgs}
        />
      </section>

      <section className="space-y-3" aria-labelledby="gap-cards-heading">
        <div className="flex items-center gap-2">
          <h2
            id="gap-cards-heading"
            className="font-heading text-lg font-bold text-foreground"
          >
            기회 카드
          </h2>
          <AutomationLevelBadge frId="FR-GR-05" />
        </div>
        <GapCardList
          gapCards={gapCards}
          stageLinks={stageLinks}
          memberNames={memberNames}
          orgs={orgs}
          collabCases={collabCases}
          proposals={proposals}
        />
      </section>
    </div>
  );
}
