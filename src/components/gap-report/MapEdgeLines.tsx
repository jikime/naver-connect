// MapEdgeLines — 연결맵·지역 맵 공용 엣지 렌더러. 좌표(positions)만 뷰마다 다르고
// 실제/잠재/공백축 부호화 규칙은 동일하게 유지한다(FR-GR-02, NFR-05).
// 근거: ARCHITECTURE.md ADR-02, TASKS.md T-018·T-020

import { cn } from "@/lib/utils";
import type { StageLink } from "@/types";
import type { MapEdge } from "./map-topology";

export function MapEdgeLines({
  edges,
  stageLinkById,
  positions,
  highlightedAxisNodes,
}: {
  edges: MapEdge[];
  stageLinkById: Map<number, StageLink>;
  positions: Record<string, { x: number; y: number }>;
  highlightedAxisNodes: Set<string>;
}) {
  return (
    <>
      {edges.map((edge) => {
        const from = positions[edge.fromNode];
        const to = positions[edge.toNode];
        const link = stageLinkById.get(edge.stageLinkId);
        if (!from || !to || !link) return null;

        const isAxisHighlight =
          highlightedAxisNodes.has(edge.fromNode) &&
          highlightedAxisNodes.has(edge.toNode);
        const isPotential = link.status === "잠재";

        return (
          <line
            key={edge.stageLinkId}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            strokeWidth={isAxisHighlight ? 3 : 2}
            strokeDasharray={isPotential ? "7 6" : undefined}
            className={cn(
              isAxisHighlight
                ? "stroke-destructive"
                : isPotential
                  ? "stroke-guud-text-muted-2"
                  : "stroke-foreground",
            )}
          >
            <title>{`STAGE_LINK #${link.id} · ${link.status} · ${link.resource_flow} — ${link.rationale}`}</title>
          </line>
        );
      })}
    </>
  );
}
