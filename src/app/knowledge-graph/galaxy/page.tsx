// 온톨로지 은하 뷰(#36) — /knowledge-graph/galaxy. connect-ontology의 Canvas 2D 은하를 이식하고
// 현재 지식그래프 데이터(getKnowledgeGraph, DAL)를 어댑터로 연결한다.
//
// gap-report·/knowledge-graph와 동일하게 Server Component: 공개층으로만 투영된 비민감 집계라
// (마스킹 대상 필드 없음) ADR-04 RSC 프리렌더. 실제 캔버스·인터랙션은 GalaxyView('use client').

import { Suspense } from "react";
import { GalaxyView } from "@/components/knowledge-graph/galaxy2/GalaxyView";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { getKnowledgeGraph } from "@/lib/dal";

const PLACEHOLDER_VIEWER = { role: "기업가", personaId: "M-001" } as const;

export default async function KnowledgeGraphGalaxyPage() {
  const graph = await getKnowledgeGraph(PLACEHOLDER_VIEWER);

  return (
    // 다크 스테이지 전용 스코프(#36): 오버레이·헤더가 다크 배경 위에서 대비를 갖도록
    // 토큰을 다크로 재정의(.galaxy-dark). 이 페이지 한정 예외(원본 온톨로지 전역 다크 이식).
    <div className="galaxy-dark flex-1 bg-[#060814] text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-[30px] py-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-guud-text-muted-2">
              지식 그래프 · 온톨로지 은하
            </p>
            <AutomationLevelBadge frId="FR-GR-02" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            사회혁신 네트워크 은하
          </h1>
          <p className="max-w-2xl text-sm text-guud-text-muted-2">
            분야는 항성이 되고, 회원·조직·산출물이 가치사슬 궤도를 공전합니다.
            안쪽 궤도(원천)에서 바깥 궤도(사업 산출물)로 갈수록 여문 성과입니다.
            천체를 누르면 상세를, 시네마 재생으로 잠재→실제 전환 이야기를
            봅니다. 공개 정보만 표시합니다.
          </p>
        </header>

        {/* GalaxyView는 useSearchParams(?entityId 동기화)를 쓰므로 Suspense 경계로 감싼다(Next 16). */}
        <Suspense
          fallback={
            <div className="grid h-[78vh] min-h-[560px] place-items-center rounded-xl border border-guud-hairline bg-[#02040d] text-sm text-slate-400">
              은하 생성 중…
            </div>
          }
        >
          <GalaxyView graph={graph} />
        </Suspense>
      </div>
    </div>
  );
}
