// ConnectionMap 노드·엣지 위상 — 손수 짠 SVG 정적 좌표(ADR-02: "노드 6종·엣지 ~12").
// 근거: ARCHITECTURE.md ADR-02·FR-GR-02/04, TASKS.md T-018
//
// 노드 6종은 region_hanbit.json의 actor_counts 중 "주체 유형"에 해당하는 앞 6항목을
// 그대로 쓴다(회원/퇴원환자연계/병원동행은 주체 유형이 아니라 커버리지 지표라 노드로
// 세지 않는다 — CoverageSummary가 그 3항목을 별도로 다룬다).
// stage_links.json의 from_stage/to_stage(vc_stage id)를 이 6노드로 그룹핑해 엣지를 만든다.
// 에너지 관련 스테이지(401/402)는 stage_links의 evidence_source가 스스로 "세 분야
// 시너지맵"·"클러스터 외 확장 예시"라 밝히는 한빛구 6노드 바깥 참고 연결이라 지도에서는
// 제외한다(데이터 삭제가 아니라 이 시각화의 스코프 밖으로만 취급 — gap_cards.json 등
// 다른 화면은 stage_links 전건을 그대로 참조).

export interface MapNode {
  id: string;
  label: string;
  /** region_hanbit.json actor_counts[].label 매칭 키 */
  actorCountLabel: string;
  /** 이 노드가 대표하는 vc_stage id 목록(0개=고립 노드) */
  stageIds: number[];
  x: number;
  y: number;
}

export interface MapEdge {
  stageLinkId: number;
  fromNode: string;
  toNode: string;
}

// 오각형 정적 레이아웃(viewBox 0 0 640 440) — 재가돌봄기관을 중심 허브로 둔다(연결 차수 최다).
export const MAP_NODES: MapNode[] = [
  {
    id: "care-home",
    label: "재가돌봄기관",
    actorCountLabel: "재가돌봄기관",
    stageIds: [201, 202, 203],
    x: 320,
    y: 220,
  },
  {
    id: "hospital",
    label: "병원·의원",
    actorCountLabel: "병원·의원",
    stageIds: [101],
    x: 320,
    y: 60,
  },
  {
    id: "social-housing",
    label: "사회주택",
    actorCountLabel: "사회주택",
    stageIds: [301, 302, 303],
    x: 472,
    y: 171,
  },
  {
    id: "transport",
    label: "교통약자 이동지원센터",
    actorCountLabel: "교통약자 이동지원센터",
    stageIds: [601],
    x: 414,
    y: 349,
  },
  {
    id: "daycare",
    label: "주야간보호",
    actorCountLabel: "주야간보호",
    // 시드에 이 유형을 잇는 STAGE_LINK/조직 매칭이 없다 — 고립 노드 자체가
    // "이용률 92%·공급부족" 신호와 부합한다.
    stageIds: [],
    x: 226,
    y: 349,
  },
  {
    id: "medical-coop",
    label: "의료사협",
    actorCountLabel: "의료사협",
    stageIds: [102],
    x: 168,
    y: 171,
  },
];

const stageToNode = new Map<number, string>();
for (const node of MAP_NODES) {
  for (const stageId of node.stageIds) {
    stageToNode.set(stageId, node.id);
  }
}

export function nodeIdForStage(stageId: number): string | undefined {
  return stageToNode.get(stageId);
}

/** stageLinks(9건) 중 6노드 양끝이 모두 해소되는 항목만 엣지로 그린다(에너지 401/402 제외). */
export function buildMapEdges(
  stageLinks: { id: number; from_stage: number; to_stage: number }[],
): MapEdge[] {
  const edges: MapEdge[] = [];
  for (const link of stageLinks) {
    const fromNode = stageToNode.get(link.from_stage);
    const toNode = stageToNode.get(link.to_stage);
    if (fromNode && toNode) {
      edges.push({ stageLinkId: link.id, fromNode, toNode });
    }
  }
  return edges;
}

/** region.highlighted_gap_axis("돌봄↔주거")를 노드 id 쌍으로 해소한다. */
const AXIS_KEYWORD_TO_NODE: Record<string, string[]> = {
  돌봄: ["care-home", "daycare"],
  주거: ["social-housing"],
  의료: ["hospital", "medical-coop"],
  교통: ["transport"],
};

export function resolveHighlightedAxisNodes(axis: string): Set<string> {
  const nodeIds = new Set<string>();
  for (const keyword of Object.keys(AXIS_KEYWORD_TO_NODE)) {
    if (axis.includes(keyword)) {
      for (const id of AXIS_KEYWORD_TO_NODE[keyword]) {
        nodeIds.add(id);
      }
    }
  }
  return nodeIds;
}
