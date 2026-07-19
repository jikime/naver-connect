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

/**
 * "회원 기관은 링 강조"(팀리드 T-020 지시) — organizations.json에서 member_id가
 * 채워진 조직(ORG-001~008, 8인 페르소나 본인 조직 1:1)이 걸린 노드를 찾는다.
 * 색이 아니라 노드 마커의 이중 테두리(링) 모양으로 표시해 NFR-05 색맹 대응을 지킨다.
 */
export function computeMemberNodeIds(
  orgs: { value_chain_stage_id: number; member_id: string | null }[],
): Set<string> {
  const nodeIds = new Set<string>();
  for (const org of orgs) {
    if (!org.member_id) continue;
    const nodeId = stageToNode.get(org.value_chain_stage_id);
    if (nodeId) nodeIds.add(nodeId);
  }
  return nodeIds;
}

/**
 * 노드별 buying power 집계(FR-GR-08 v1.1) — 해당 노드의 stageIds에 걸리는 조직들의
 * buying_power 평균(반올림)을 노드 id → 값으로 반환한다. 연결맵·지역맵 노드 마커에
 * 표시해 "구매력" 지표를 지도 위에서 바로 보이게 한다. 매칭 조직이 없는 노드(예:
 * 고립 노드 주야간보호)는 결과에서 제외된다.
 */
export function computeNodeBuyingPower(
  orgs: { value_chain_stage_id: number; buying_power: number }[],
): Record<string, number> {
  const sums = new Map<string, { total: number; count: number }>();
  for (const org of orgs) {
    const nodeId = stageToNode.get(org.value_chain_stage_id);
    if (!nodeId) continue;
    const entry = sums.get(nodeId) ?? { total: 0, count: 0 };
    entry.total += org.buying_power;
    entry.count += 1;
    sums.set(nodeId, entry);
  }
  const result: Record<string, number> = {};
  for (const [nodeId, { total, count }] of sums) {
    result[nodeId] = Math.round(total / count);
  }
  return result;
}

// ---------------------------------------------------------------------------
// 지역 맵 뷰(T-020) — 같은 6노드·엣지를 "구역 지도" 프레이밍으로 재배치한다.
// 한빛구는 가상 지역이라 실제 TopoJSON 경계가 없다(팀리드 지시) — 외곽선·구역
// 블록 전부 손수 그린 정적 도형(둥근 사각형)으로 "추상화된 지도"임을 의도적으로
// 드러낸다. 좌표는 ADR-02와 동일하게 사전계산된 상수(런타임 레이아웃 계산 없음).

export interface MapZone {
  id: string;
  label: string;
  /** 이 구역에 속한 노드 id들 */
  nodeIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  /** guud 토큰만 사용하는 채움 클래스 — 색상보다 라벨·테두리 패턴으로 구분(NFR-05) */
  fillClassName: string;
}

export const DISTRICT_VIEWBOX = { width: 640, height: 460 };

export const DISTRICT_BOUNDARY = { x: 20, y: 20, width: 600, height: 420 };

// 팀리드 지시: "canvas 바탕, hairline 경계" — 구역은 채움색 다변화 대신 캔버스
// 배경 + hairline 테두리로 통일하고, 구역 구분은 라벨 텍스트가 맡는다(NFR-05
// "색보다 라벨" 원칙과도 일치). header-band 베이지는 아래 DISTRICT_GREENS의
// 소규모 "공원" 장식에만 절제해서 쓴다.
export const DISTRICT_ZONES: MapZone[] = [
  {
    id: "care-zone",
    label: "돌봄권역",
    nodeIds: ["care-home", "daycare"],
    x: 40,
    y: 40,
    width: 280,
    height: 200,
    fillClassName: "fill-background",
  },
  {
    id: "medical-zone",
    label: "의료권역",
    nodeIds: ["hospital", "medical-coop"],
    x: 340,
    y: 40,
    width: 240,
    height: 200,
    fillClassName: "fill-background",
  },
  {
    id: "housing-zone",
    label: "주거권역",
    nodeIds: ["social-housing"],
    x: 40,
    y: 260,
    width: 240,
    height: 160,
    fillClassName: "fill-background",
  },
  {
    id: "transport-zone",
    label: "교통권역",
    nodeIds: ["transport"],
    x: 300,
    y: 260,
    width: 280,
    height: 160,
    fillClassName: "fill-background",
  },
];

/**
 * "동네" 느낌을 위한 장식용 녹지·공원 패치 — 데이터 아님(순수 장식), 구역 사이
 * 여백에 header-band 베이지를 절제해서 얹는다("녹지/공원 암시", 팀리드 지시).
 * 경계 없이 부드러운 원형(rx=height/2)만 써서 각진 구역 블록과 형태로도 구분된다.
 */
export const DISTRICT_GREEN_PATCHES = [
  { id: "park-center", cx: 320, cy: 230, r: 26 },
  { id: "park-south", cx: 300, cy: 400, r: 16 },
] as const;

/** 지역 맵 뷰에서 각 노드가 자리할 좌표(구역 내부). 그래프 뷰(MAP_NODES.x/y)와는 별개. */
export const DISTRICT_NODE_POSITIONS: Record<string, { x: number; y: number }> =
  {
    "care-home": { x: 180, y: 100 },
    daycare: { x: 180, y: 190 },
    hospital: { x: 460, y: 100 },
    "medical-coop": { x: 460, y: 190 },
    "social-housing": { x: 160, y: 340 },
    transport: { x: 440, y: 340 },
  };
