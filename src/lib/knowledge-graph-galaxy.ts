// KG → 온톨로지 은하(#36) 어댑터(순수 함수). getKnowledgeGraph의 KGNode/KGEdge를 이식된 은하
// 컴포넌트가 기대하는 GraphNode/GraphEdge/EntityDetail/Stats/Schema/Search 형태로 변환한다.
// BR-01: 공개층(KGNode.detail·label·field)만 투영 — summary·properties에 비공개 필드 없음.
//   원본 컴포넌트는 무수정 이식하고, 데이터 형태 차이는 이 어댑터가 흡수한다(team-lead #36).

import type {
  EntityDetail,
  EntityRelation,
  GalaxyGraphEdge,
  GalaxyGraphNode,
  GalaxySchemaClass,
  GalaxySearchEntity,
  GalaxyStats,
} from "@/components/knowledge-graph/galaxy2/types";
import fieldsSeed from "@/data/fields.json";
import type { Field, KGNode, KGNodeType, KnowledgeGraph } from "@/types";

const fields = fieldsSeed as Field[];
const fieldName = (id: number) =>
  fields.find((f) => f.id === id)?.name ?? `분야 ${id}`;

const CLASS_KEY: Record<KGNodeType, string> = {
  member: "member",
  org: "org",
  project: "deal_room",
  doc: "opportunity_card",
  system: "resource",
  agg: "org",
};

const CLASS_LABEL: Record<string, string> = {
  field: "분야",
  member: "회원",
  org: "조직",
  deal_room: "딜룸·사업",
  opportunity_card: "문서·기회",
  resource: "시스템·기반",
};

function summaryOf(n: KGNode): string {
  return n.detail.quote ?? n.detail.subtitle ?? "";
}

/** 공개 detail을 표시용 속성 맵으로 평탄화(BR-01: rows·subtitle만). */
function propertiesOf(n: KGNode): Record<string, string> {
  const props: Record<string, string> = {};
  if (n.detail.subtitle) props.요약 = n.detail.subtitle;
  for (const r of n.detail.rows ?? []) props[r.k] = r.v;
  return props;
}

export interface GalaxyGraph {
  nodes: GalaxyGraphNode[];
  edges: GalaxyGraphEdge[];
}

export function toGalaxyGraph(graph: KnowledgeGraph): GalaxyGraph {
  const fieldCount = new Map<number, number>();
  for (const n of graph.nodes) {
    if (n.field != null)
      fieldCount.set(n.field, (fieldCount.get(n.field) ?? 0) + 1);
  }
  const suns: GalaxyGraphNode[] = [...fieldCount.keys()]
    .sort((a, b) => a - b)
    .map((fid) => ({
      id: `field-${fid}`,
      classKey: "field",
      label: fieldName(fid),
      degree: fieldCount.get(fid) ?? 1,
      fieldId: fid,
    }));
  const mapped: GalaxyGraphNode[] = graph.nodes.map((n) => ({
    id: n.id,
    classKey: CLASS_KEY[n.type],
    label: n.label,
    degree: n.degree,
    fieldId: n.field ?? null,
    summary: summaryOf(n),
  }));
  const edges: GalaxyGraphEdge[] = graph.edges.map((e) => ({
    id: e.id,
    typeKey: e.rel,
    typeLabel: e.rel,
    sourceId: e.source,
    targetId: e.target,
    kind: e.kind,
    emphasis: e.emphasis,
  }));
  return { nodes: [...suns, ...mapped], edges };
}

/** 범례용 스키마: 데이터에 실제 등장하는 천체 유형. */
export function toGalaxySchema(graph: KnowledgeGraph): {
  classes: GalaxySchemaClass[];
} {
  const present = new Set<string>(["field"]);
  for (const n of graph.nodes) present.add(CLASS_KEY[n.type]);
  const order = [
    "field",
    "member",
    "org",
    "opportunity_card",
    "deal_room",
    "resource",
  ];
  return {
    classes: order
      .filter((k) => present.has(k))
      .map((k) => ({ key: k, label: CLASS_LABEL[k] ?? k })),
  };
}

/** HUD 통계: 실제/잠재 연결 수·전환 기회·유형별 수·허브 노드. */
export function toGalaxyStats(graph: KnowledgeGraph): GalaxyStats {
  let realCount = 0;
  let potentialCount = 0;
  let hotLeadCount = 0;
  for (const e of graph.edges) {
    if (e.kind === "potential") potentialCount++;
    else realCount++;
    if (e.emphasis) hotLeadCount++;
  }
  const classCounts = new Map<string, number>();
  for (const n of graph.nodes) {
    const k = CLASS_KEY[n.type];
    classCounts.set(k, (classCounts.get(k) ?? 0) + 1);
  }
  const topConnected = [...graph.nodes]
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 3)
    .map((n) => ({ id: n.id, label: n.label, degree: n.degree }));
  return {
    realCount,
    potentialCount,
    hotLeadCount,
    classCounts: [...classCounts].map(([classKey, count]) => ({
      classKey,
      count,
    })),
    topConnected,
  };
}

/** 검색용 엔티티 목록(공개 라벨만). */
export function toSearchEntities(graph: KnowledgeGraph): GalaxySearchEntity[] {
  return graph.nodes.map((n) => ({
    id: n.id,
    classKey: CLASS_KEY[n.type],
    label: n.label,
    classLabel: CLASS_LABEL[CLASS_KEY[n.type]] ?? n.type,
  }));
}

/** 노드 상세(관계망 포함). 없으면 null. */
export function toEntityDetail(
  graph: KnowledgeGraph,
  id: string,
): EntityDetail | null {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  // 항성(분야) 클릭.
  if (id.startsWith("field-")) {
    const fid = Number(id.slice("field-".length));
    if (Number.isNaN(fid)) return null;
    const members = graph.nodes.filter((n) => n.field === fid);
    return {
      id,
      classKey: "field",
      classLabel: "분야(항성)",
      label: fieldName(fid),
      summary: `${members.length}개 회원·조직이 이 분야에 속합니다.`,
      properties: { "소속 천체": String(members.length) },
      masked: false,
      privateProperties: null,
      relations: members.map((m) => ({
        relationId: `field-${fid}:${m.id}`,
        typeLabel: "소속 천체",
        direction: "out" as const,
        other: { id: m.id, label: m.label },
      })),
    };
  }

  const node = byId.get(id);
  if (!node) return null;
  const classKey = CLASS_KEY[node.type];

  const relations: EntityRelation[] = [];
  for (const e of graph.edges) {
    if (e.source === id) {
      const other = byId.get(e.target);
      if (other)
        relations.push({
          relationId: `${e.id}`,
          typeLabel: e.rel,
          kind: e.kind,
          direction: "out",
          other: { id: other.id, label: other.label },
        });
    } else if (e.target === id) {
      const other = byId.get(e.source);
      if (other)
        relations.push({
          relationId: `${e.id}`,
          typeLabel: e.rel,
          kind: e.kind,
          direction: "in",
          other: { id: other.id, label: other.label },
        });
    }
  }

  return {
    id,
    classKey,
    classLabel: CLASS_LABEL[classKey] ?? node.type,
    label: node.label,
    summary: summaryOf(node),
    properties: propertiesOf(node),
    masked: false, // 공개층 그래프 — 비공개 데이터 없음(BR-01)
    privateProperties: null,
    relations,
  };
}
