// 온톨로지 은하 뷰(#36) — /knowledge-graph/galaxy. connect-ontology의 Canvas 2D 은하를 이식하고
// 현재 지식그래프 데이터(getKnowledgeGraph, DAL)를 어댑터로 연결한다.
//
// gap-report·/knowledge-graph와 동일하게 Server Component: 공개층으로만 투영된 비민감 집계라
// (마스킹 대상 필드 없음) ADR-04 RSC 프리렌더. 실제 캔버스·인터랙션은 GalaxyView('use client').

import { Suspense } from "react";
import { GalaxyView } from "@/components/knowledge-graph/galaxy2/GalaxyView";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { getKnowledgeGraph } from "@/lib/dal";
import {
  getDatasetDocument,
  getServerDataset,
} from "@/lib/dal/server-datasets";
import type { Field } from "@/types";

const PLACEHOLDER_VIEWER = { role: "기업가", personaId: "M-001" } as const;

export default async function KnowledgeGraphGalaxyPage() {
  const [graph, fields] = await Promise.all([
    getKnowledgeGraph(PLACEHOLDER_VIEWER, getServerDataset),
    getDatasetDocument<Field[]>("fields"),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-6 py-14 sm:px-10 lg:px-16">
          <div className="space-y-3">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ KNOWLEDGE GRAPH · ONTOLOGY GALAXY ]
            </p>
            <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              사회혁신 네트워크 <span className="text-primary">은하</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
              분야는 항성이 되고, 회원·조직·산출물이 가치사슬 궤도를 공전합니다.
              안쪽 궤도(원천)에서 바깥 궤도(사업 산출물)로 갈수록 여문
              성과입니다. 천체를 누르면 상세를, 시네마 재생으로 잠재→실제 전환
              이야기를 봅니다. 공개 정보만 표시합니다.
            </p>
          </div>
          <AutomationLevelBadge frId="FR-GR-02" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
        {/* GalaxyView는 useSearchParams(?entityId 동기화)를 쓰므로 Suspense 경계로 감싼다(Next 16). */}
        <div className="galaxy-dark text-foreground">
          <Suspense
            fallback={
              <div className="grid h-[78vh] min-h-[560px] place-items-center rounded-xl border border-guud-hairline bg-[#02040d] text-sm text-muted-foreground">
                은하 생성 중…
              </div>
            }
          >
            <GalaxyView graph={graph} fields={fields.data} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
