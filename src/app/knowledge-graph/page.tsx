// 지식 그래프(A-v2) — 사람·조직·프로젝트·문서·시스템 도메인 그래프. React Flow 2D + 3D 토글.
// 근거: team-lead A-v2 요청, BR-01, ADR-03/ADR-04/ADR-05.
//
// Server Component로 둔다: getKnowledgeGraph는 공개층으로만 투영된 비민감 집계라(마스킹 대상
// 필드 없음) gap-report/page.tsx와 동일하게 ADR-04 "정적·비민감 콘텐츠는 RSC 프리렌더" 원칙을
// 따른다. DAL 계약(ADR-05)상 ViewerContext가 필요하므로 layout.tsx·gap-report와 동일 placeholder를
// 쓴다. 실제 인터랙션(2D/3D·필터·드래그·상세)은 KnowledgeGraphView('use client')로 분리한다.

import { KnowledgeGraphView } from "@/components/knowledge-graph/KnowledgeGraphView";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { getKnowledgeGraph } from "@/lib/dal";

const PLACEHOLDER_VIEWER = { role: "기업가", personaId: "M-001" } as const;

export default async function KnowledgeGraphPage() {
  const graph = await getKnowledgeGraph(PLACEHOLDER_VIEWER);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-[30px] py-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-guud-text-muted-2">
            도메인 지식 그래프 · A-v2
          </p>
          <AutomationLevelBadge frId="FR-GR-02" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          사회혁신 네트워크 지식 그래프
        </h1>
        <p className="max-w-2xl text-sm text-guud-text-muted-2">
          회원·조직·딜룸·문서·시스템이 어떻게 이어지는지 한 화면에서 봅니다.
          딜룸 4개를 중심으로 실제 연결은 실선, 잠재 연결은 점선, 잠재가 실제로
          전환되는 기회는 빨강으로 강조합니다. 노드는 유형별로 접었다 펼 수
          있고, 2D 평면 뷰와 3D 입체 뷰를 전환할 수 있습니다. 공개 정보만
          표시합니다.
        </p>
      </header>

      <KnowledgeGraphView graph={graph} />
    </div>
  );
}
