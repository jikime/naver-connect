import { describe, expect, it } from "vitest";
import embeddingShadow from "@/data/people/derived/member-embedding-shadow.json";

describe("member embedding shadow", () => {
  it("contains one finite projected node for every mock member", () => {
    expect(embeddingShadow.model.dimensions).toBe(1024);
    expect(embeddingShadow.input.private_fields_included).toBe(false);
    expect(embeddingShadow.nodes).toHaveLength(8);
    expect(
      new Set(embeddingShadow.nodes.map((node) => node.member_id)).size,
    ).toBe(8);
    for (const node of embeddingShadow.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(Math.abs(node.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(node.y)).toBeLessThanOrEqual(1);
    }
  });

  it("keeps original 1024D nearest neighbors separate from the 2D projection", () => {
    expect(embeddingShadow.projection.global_distance_is_exact).toBe(false);
    for (const node of embeddingShadow.nodes) {
      expect(node.top_neighbors).toHaveLength(3);
      expect(
        node.top_neighbors.some(
          (neighbor) => neighbor.member_id === node.member_id,
        ),
      ).toBe(false);
      expect(
        node.top_neighbors.every(
          (neighbor) => neighbor.cosine >= -1 && neighbor.cosine <= 1,
        ),
      ).toBe(true);
    }
  });

  it("contains every unordered member pair exactly once", () => {
    const keys = embeddingShadow.pairs.map(({ a, b }) =>
      [a, b].sort().join("↔"),
    );
    expect(keys).toHaveLength(28);
    expect(new Set(keys).size).toBe(28);
  });
});
