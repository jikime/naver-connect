// 지식 그래프(A-v2) — /knowledge-graph 라우트의 노드·엣지 뷰 모델.
// 근거: team-lead A-v2 요청(React Flow 2D + 3D 토글), BR-01(최소 노출 원칙).
// 이 타입들은 DAL(getKnowledgeGraph)이 "공개층으로만 투영"한 결과물이다 —
// visibility.private·contact_point·min_exposure_note·hot_lead 등 비공개 필드는
// 이 구조 어디에도 담기지 않는다(BR-01, ADR-03). 그래프는 클라이언트로 통째로
// 직렬화되므로, 여기 들어온 값은 곧 브라우저에 도달한다는 전제로만 채운다.

export type KGNodeType =
  | "member"
  | "org"
  | "project"
  | "doc"
  | "system"
  | "agg";

/** 상세 패널이 렌더하는 공개-안전 필드 묶음(자유 서술 금지, 원문 인용 금지). */
export interface KGNodeDetail {
  subtitle?: string;
  rows?: { k: string; v: string }[];
  quote?: string;
  tags?: { k: string; items: string[] }[];
  gates?: { label: string; passed: boolean }[];
  list?: { k: string; items: string[] };
  note?: string;
}

export interface KGNode {
  id: string;
  type: KGNodeType;
  label: string;
  /** 연결 중심성(degree) — 노드 크기의 근거. DAL이 엣지 집계 후 채운다. */
  degree: number;
  /** 주 분야 id(공개 field_tags[0]) — 은하 뷰의 행성(분야) 배치용. 없으면 분야 무관 노드. */
  field?: number;
  detail: KGNodeDetail;
}

export interface KGEdge {
  id: string;
  source: string;
  target: string;
  /** 관계명 라벨(소속·담당·참여·생성·근거·발원·사용·공고 유입·발견·추천유형 등). */
  rel: string;
  /** 실제 연결(실선) vs 잠재 연결(점선). */
  kind: "real" | "potential";
  /** 잠재→실제 전환 기회(red 강조). 넓은 면이 아닌 좁은 강조에만 쓴다(guud Don't). */
  emphasis: boolean;
}

/** 그래프 부가 메타 — 스토리 모드의 커버리지 카드 등에 쓰는 공개 지역 지표. */
export interface KGMeta {
  region: string;
  coveragePotential: number;
  coverageActual: number;
  coverageRate: number;
}

export interface KnowledgeGraph {
  nodes: KGNode[];
  edges: KGEdge[];
  meta?: KGMeta;
}
