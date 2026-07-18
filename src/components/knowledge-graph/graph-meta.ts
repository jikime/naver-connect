// 지식 그래프 공유 메타 — 노드 유형색·라벨·레이아웃(d3-force). 순수 데이터/계산 모듈.
// 근거: team-lead A-v2("d3-force 드래그"), guud DESIGN.md(dataviz는 Known Gaps라 그래프 전용 팔레트를
// 로컬 정의하되 red #FF3E2F는 전환 기회 강조에만 한정 — 넓은 면 금지 Don't 준수).

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import type { KGEdge, KGNode, KGNodeType } from "@/types";

export const KG_TYPE_META: Record<KGNodeType, { ko: string; color: string }> = {
  member: { ko: "사람", color: "#2F7E77" }, // teal
  org: { ko: "조직", color: "#C67B2C" }, // ochre
  project: { ko: "프로젝트", color: "#3355A0" }, // indigo — 중심 앵커
  doc: { ko: "문서", color: "#8B4E86" }, // plum
  system: { ko: "시스템", color: "#6B8E4E" }, // moss
  agg: { ko: "조직(집계)", color: "#9A917F" }, // warm grey
};

export const KG_TYPE_ORDER: KGNodeType[] = [
  "member",
  "org",
  "project",
  "doc",
  "system",
  "agg",
];

/** 전환 기회(잠재→실제) 강조색 — guud accent-primary. 좁은 강조에만 사용. */
export const KG_EMPHASIS_COLOR = "#FF3E2F";

/** 차수 기반 노드 반경(중심성 = 크기). 레이아웃 충돌·3D val에 공통 사용. */
export function nodeRadius(node: KGNode): number {
  const base = node.type === "project" ? 22 : 15;
  return Math.min(46, base + node.degree * 2.6);
}

/** 2D 카드 폭 추정(라벨 길이 기준). */
export function nodeWidth(node: KGNode): number {
  return Math.max(104, Math.min(220, node.label.length * 13 + 40));
}

export interface XY {
  x: number;
  y: number;
}

interface SimNode extends XY {
  id: string;
  type: KGNodeType;
  r: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * d3-force 결정적 레이아웃. 초기 위치를 시드 나선으로 깔아(Math.random 미의존) 노드 좌표를 산출한다.
 * 프로젝트(딜룸)는 중심으로 강하게 당겨 방사형 앵커가 되게 한다.
 */
export function computeLayout(
  nodes: KGNode[],
  edges: KGEdge[],
  width = 1280,
  height = 760,
): Map<string, XY> {
  const cx = width / 2;
  const cy = height / 2;
  const sim: SimNode[] = nodes.map((n, i) => {
    // 황금각 나선 초기 배치 — 결정적이며 좌표 충돌이 없다.
    const ang = i * 2.399963;
    const rad = 40 + Math.sqrt(i) * 46;
    return {
      id: n.id,
      type: n.type,
      r: nodeRadius(n),
      x: cx + Math.cos(ang) * rad,
      y: cy + Math.sin(ang) * rad,
    };
  });
  const byId = new Map(sim.map((s) => [s.id, s]));
  const links = edges
    .map((e) => ({ source: byId.get(e.source), target: byId.get(e.target) }))
    .filter((l) => l.source && l.target) as {
    source: SimNode;
    target: SimNode;
  }[];

  const simulation = forceSimulation<SimNode>(sim)
    .force(
      "charge",
      forceManyBody<SimNode>().strength((d) => -220 - d.r * 6),
    )
    .force(
      "link",
      forceLink<SimNode, { source: SimNode; target: SimNode }>(links)
        .id((d) => d.id)
        .distance(120)
        .strength(0.18),
    )
    .force(
      "collide",
      forceCollide<SimNode>()
        .radius((d) => d.r + 26)
        .strength(0.9),
    )
    .force("center", forceCenter(cx, cy))
    // 프로젝트는 중심으로 강하게, 나머지는 약하게 당긴다(방사형).
    .force(
      "x",
      forceX<SimNode>(cx).strength((d) => (d.type === "project" ? 0.28 : 0.03)),
    )
    .force(
      "y",
      forceY<SimNode>(cy).strength((d) => (d.type === "project" ? 0.28 : 0.03)),
    )
    .stop();

  const ticks = 320;
  for (let i = 0; i < ticks; i++) simulation.tick();

  const out = new Map<string, XY>();
  for (const s of sim) out.set(s.id, { x: s.x, y: s.y });
  return out;
}

/** 노드별 인접 노드 집합 — hover/선택 하이라이트에 사용. */
export function buildAdjacency(edges: KGEdge[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    const set = adj.get(a) ?? new Set<string>();
    set.add(b);
    adj.set(a, set);
  };
  for (const e of edges) {
    add(e.source, e.target);
    add(e.target, e.source);
  }
  return adj;
}
