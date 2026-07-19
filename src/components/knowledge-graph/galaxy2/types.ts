// 은하(#36) 뷰 모델 계약 — connect-ontology의 GraphNode/GraphEdge/EntityDetail/Stats/Schema 이식.
// 캔버스 엔진과 포팅된 UI(검색·범례·HUD·상세)가 공유한다. 값은 모두 공개층 투영(BR-01).

export interface GalaxyGraphNode {
  id: string;
  classKey: string;
  label: string;
  degree: number;
  fieldId: number | null;
  /** 상세/검색용 공개 요약(비공개층 없음). */
  summary?: string;
}

export interface GalaxyGraphEdge {
  id?: string;
  typeKey?: string;
  typeLabel?: string;
  sourceId: string;
  targetId: string;
  /** "potential"이면 점선(잠재), 그 외 실선(실제). */
  kind?: string;
  strength?: string;
  /** 전환 기회 강조(황금 성좌선). */
  emphasis?: boolean;
}

export interface EntityRelation {
  relationId: string;
  typeLabel: string;
  kind?: string;
  strength?: string;
  direction: "out" | "in";
  other: { id: string; label: string };
}

export interface EntityDetail {
  id: string;
  classKey: string;
  classLabel: string;
  label: string;
  summary?: string;
  properties: Record<string, string>;
  /** 공개 그래프이므로 항상 false(비공개층 없음). */
  masked: boolean;
  privateProperties: Record<string, string> | null;
  relations: EntityRelation[];
}

export interface GalaxyStats {
  realCount: number;
  potentialCount: number;
  hotLeadCount: number;
  classCounts: { classKey: string; count: number }[];
  topConnected: { id: string; label: string; degree: number }[];
}

export interface GalaxySchemaClass {
  key: string;
  label: string;
}

export interface GalaxySearchEntity {
  id: string;
  classKey: string;
  label: string;
  classLabel: string;
  region?: string;
}
