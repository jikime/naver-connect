// /ecosystem — 생태계맵 v2. 정적 셸은 Server Component, 본문(드릴다운·내 소속단체)은 Client(ADR-04).
// 근거: PRD §8.15, ARCHITECTURE.md §3, FR-EM2-01~04, TASKS #28
// v1.1: 구 FR-EM-01~03 "이웃회원·주변조직" 카드 리스트를 밸류체인→5-force→단체→지역
// 드릴다운으로 전면 개편(§8.11 대체). 온보딩 직후 진입점 역할은 유지한다(FR-GL-04).

import type { Metadata } from "next";
import { EcosystemMapV2 } from "@/components/ecosystem/EcosystemMapV2";
import { getEcosystemMap } from "@/lib/dal";

export const metadata: Metadata = {
  title: "생태계맵 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

// getEcosystemMap 응답(밸류체인·5-force·단체)은 역할·페르소나에 무관한 비민감 공개
// 집계라, gap-report/page.tsx와 동일하게 placeholder ViewerContext로 서버에서 미리
// 가져온다(ADR-04). "내 소속/대상 단체"(FR-EM2-03)만 실제 뷰어 컨텍스트가 필요해
// MyOrgsPanel(Client)에서 별도로 조회한다.
const PLACEHOLDER_VIEWER = { role: "기업가", personaId: "M-001" } as const;

export default async function EcosystemPage() {
  const { stages, forces, orgs } = await getEcosystemMap(PLACEHOLDER_VIEWER);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-[30px] py-10">
      <header className="mb-6 space-y-2">
        <p className="text-xs font-semibold text-guud-text-muted-2">
          2단계 · 생태계맵
        </p>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          생태계맵 — 밸류체인 · 5-force · 실제 단체
        </h1>
        <p className="max-w-2xl text-sm text-guud-text-muted-2">
          분야별 밸류체인에서 한 단계를 고르면 그 단계의 5-force 이해관계자와
          실제 존재하는 단체를 지역별로 볼 수 있어요. 내 소속 단체와 대상 단체를
          설정하면 그 관계 중심의 종합 뷰도 함께 보여줍니다.
        </p>
      </header>
      <EcosystemMapV2 stages={stages} forces={forces} orgs={orgs} />
    </div>
  );
}
