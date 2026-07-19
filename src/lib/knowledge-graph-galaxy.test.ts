// 은하 어댑터(#36) 유닛 — 구조 변환 + BR-01(비공개층 미투영) 회귀 방지.
// connect-ontology galaxy-canvas.test 취지(결정적·공개 데이터)를 우리 어댑터로 이식.

import { describe, expect, it } from "vitest";
// eslint-disable-next-line no-restricted-imports -- BR-01 비유출 검증 테스트는 "유출되면 안 되는 원문"(민감 시드)을 ground truth로 직접 읽어야 부재를 단언할 수 있다. 테스트 파일 한정 예외(런타임 번들 미포함).
import recommendationsSeed from "@/data/private/recommendations.json";
import { getKnowledgeGraph } from "./dal";
import {
  toEntityDetail,
  toGalaxyGraph,
  toGalaxySchema,
  toGalaxyStats,
  toSearchEntities,
} from "./knowledge-graph-galaxy";

const VIEWER = { role: "기업가", personaId: "M-001" } as const;

describe("toGalaxyGraph", () => {
  it("분야를 항성(field)으로 합성하고 회원·조직에 fieldId를 부여한다", async () => {
    const graph = await getKnowledgeGraph(VIEWER);
    const g = toGalaxyGraph(graph);
    const suns = g.nodes.filter((n) => n.classKey === "field");
    expect(suns.length).toBeGreaterThan(0);
    for (const s of suns) expect(s.id.startsWith("field-")).toBe(true);
    // 딜룸은 deal_room 천체로 매핑된다.
    expect(g.nodes.some((n) => n.classKey === "deal_room")).toBe(true);
    // 엣지 계약: sourceId/targetId + kind.
    for (const e of g.edges) {
      expect(typeof e.sourceId).toBe("string");
      expect(typeof e.targetId).toBe("string");
    }
  });
});

describe("toEntityDetail", () => {
  it("실제 노드의 관계망을 만들고 masked=false·비공개 없음(BR-01)", async () => {
    const graph = await getKnowledgeGraph(VIEWER);
    const d = toEntityDetail(graph, "M-001");
    expect(d).not.toBeNull();
    expect(d?.classKey).toBe("member");
    expect(d?.masked).toBe(false);
    expect(d?.privateProperties).toBeNull();
    expect(d?.relations.length ?? 0).toBeGreaterThan(0);
  });

  it("항성(field-*) 클릭 시 소속 천체 관계를 반환한다", async () => {
    const graph = await getKnowledgeGraph(VIEWER);
    // 돌봄(2)에 소속된 노드가 있으므로 field-2 상세가 생성된다.
    const d = toEntityDetail(graph, "field-2");
    expect(d?.classKey).toBe("field");
    expect(d?.relations.length ?? 0).toBeGreaterThan(0);
  });

  it("BR-01: 추천 원문/최소노출 문구가 어댑터 산출물에 실리지 않는다", async () => {
    const graph = await getKnowledgeGraph(VIEWER);
    const blob = JSON.stringify({
      graph: toGalaxyGraph(graph),
      stats: toGalaxyStats(graph),
      schema: toGalaxySchema(graph),
      search: toSearchEntities(graph),
      details: graph.nodes.map((n) => toEntityDetail(graph, n.id)),
    });
    for (const rec of recommendationsSeed as Array<{
      message: { contact_point: string };
      min_exposure_note: string;
    }>) {
      expect(blob.includes(rec.message.contact_point)).toBe(false);
      expect(blob.includes(rec.min_exposure_note)).toBe(false);
    }
    expect(blob.includes("hot_lead")).toBe(false);
    expect(blob.includes("demand")).toBe(false);
  });
});

describe("toGalaxyStats", () => {
  it("실제/잠재 연결 수와 허브 노드를 집계한다", async () => {
    const graph = await getKnowledgeGraph(VIEWER);
    const s = toGalaxyStats(graph);
    expect(s.realCount + s.potentialCount).toBe(graph.edges.length);
    expect(s.topConnected.length).toBeGreaterThan(0);
    expect(s.topConnected.length).toBeLessThanOrEqual(3);
  });
});
