// DAL 지식 그래프(A-v2) 조립 유닛 — 구조 무결성 + BR-01(비공개 원문 미투영) 회귀 방지.
// 근거: team-lead A-v2 요청, BR-01, ADR-03.

import { describe, expect, it } from "vitest";
import recommendationsSeed from "@/data/private/recommendations.json";
import { getKnowledgeGraph } from "./knowledge-graph";

const VIEWER = { role: "기업가", personaId: "M-001" } as const;

describe("getKnowledgeGraph", () => {
  it("5유형 노드를 모두 포함하고 딜룸 5개가 프로젝트로 들어간다", async () => {
    const { nodes } = await getKnowledgeGraph(VIEWER);
    const byType = (t: string) => nodes.filter((n) => n.type === t);
    expect(byType("member")).toHaveLength(8);
    expect(byType("project")).toHaveLength(5);
    expect(byType("doc").length).toBeGreaterThanOrEqual(5); // 리포트 + 기회카드 3 + 규약
    expect(byType("system")).toHaveLength(6);
    expect(byType("agg").length).toBeGreaterThan(0);
    expect(byType("org").length).toBeGreaterThan(0);
  });

  it("모든 엣지의 양끝 노드가 실재한다(dangling 없음)", async () => {
    const { nodes, edges } = await getKnowledgeGraph(VIEWER);
    const ids = new Set(nodes.map((n) => n.id));
    for (const e of edges) {
      expect(ids.has(e.source)).toBe(true);
      expect(ids.has(e.target)).toBe(true);
    }
    expect(edges.length).toBeGreaterThan(30);
  });

  it("차수(degree)가 집계되고 김서연(M-001)·돌봄 딜룸이 상위 허브다", async () => {
    const { nodes } = await getKnowledgeGraph(VIEWER);
    const kim = nodes.find((n) => n.id === "M-001");
    expect(kim?.degree).toBeGreaterThan(0);
    const maxMemberDeg = Math.max(
      ...nodes.filter((n) => n.type === "member").map((n) => n.degree),
    );
    expect(kim?.degree).toBe(maxMemberDeg); // M-001이 사람 중 최대 차수
  });

  it("전환 기회(emphasis) 엣지가 최소 1건 존재한다", async () => {
    const { edges } = await getKnowledgeGraph(VIEWER);
    expect(edges.some((e) => e.emphasis)).toBe(true);
  });

  it("BR-01: 추천 message 원문/최소노출문구가 그래프 어디에도 실리지 않는다", async () => {
    const graph = await getKnowledgeGraph(VIEWER);
    const blob = JSON.stringify(graph);
    // 실제 시드의 민감 문자열이 직렬화 결과에 등장하면 누출이다.
    for (const rec of recommendationsSeed as Array<{
      message: { contact_point: string; your_benefit: string };
      min_exposure_note: string;
      matching_rationale: string;
    }>) {
      expect(blob.includes(rec.message.contact_point)).toBe(false);
      expect(blob.includes(rec.min_exposure_note)).toBe(false);
      expect(blob.includes(rec.matching_rationale)).toBe(false);
    }
  });

  it("BR-01: 회원 비공개층(visibility.private) 흔적이 없다", async () => {
    const { nodes } = await getKnowledgeGraph(VIEWER);
    const blob = JSON.stringify(nodes);
    expect(blob.includes("visibility")).toBe(false);
    expect(blob.includes("hot_lead")).toBe(false);
    expect(blob.includes("demand")).toBe(false);
  });
});
