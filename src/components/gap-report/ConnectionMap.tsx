"use client";

// ConnectionMap — 손수 짠 인라인 SVG 연결맵(FR-GR-02/04, ADR-02).
// 근거: ARCHITECTURE.md ADR-02·NFR-05·§18, TASKS.md T-018
// Canvas/react-flow 대신 좌표 사전계산 + React가 그리는 SVG(ADR-02 결정). 노드는
// 포커서블 <g role="button" tabIndex>, 실제/잠재는 색+stroke-dasharray+범례 텍스트로
// 삼중 부호화한다(색맹 대응, NFR-05). 좌표가 상수라 리렌더마다 재계산하지 않는다.
//
// T-020(지역 맵 뷰) 이후 selectedId·onSelectNode는 상위(GapEcosystemMapToggle)가 들고
// DistrictMapView와 상태를 공유한다 — 이 컴포넌트는 그래프 배치만 담당하는 controlled뷰.

import { useMemo } from "react";
import type { Region, StageLink } from "@/types";
import { MapEdgeLines } from "./MapEdgeLines";
import { MapLegend } from "./MapLegend";
import { MapNodeMarker } from "./MapNodeMarker";
import {
  buildMapEdges,
  MAP_NODES,
  resolveHighlightedAxisNodes,
} from "./map-topology";

export function ConnectionMap({
  region,
  stageLinks,
  memberNodeIds,
  buyingPowerByNode,
  selectedId,
  onSelectNode,
}: {
  region: Region;
  stageLinks: StageLink[];
  memberNodeIds: Set<string>;
  buyingPowerByNode: Record<string, number>;
  selectedId: string | null;
  onSelectNode: (id: string) => void;
}) {
  const edges = useMemo(() => buildMapEdges(stageLinks), [stageLinks]);
  const highlightedAxisNodes = useMemo(
    () => resolveHighlightedAxisNodes(region.highlighted_gap_axis),
    [region.highlighted_gap_axis],
  );
  const stageLinkById = useMemo(
    () => new Map(stageLinks.map((link) => [link.id, link])),
    [stageLinks],
  );
  const positions = useMemo(
    () => Object.fromEntries(MAP_NODES.map((n) => [n.id, { x: n.x, y: n.y }])),
    [],
  );
  const nodeById = useMemo(() => new Map(MAP_NODES.map((n) => [n.id, n])), []);

  return (
    <div className="border border-guud-hairline p-2">
      <svg
        viewBox="0 0 640 440"
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{`${region.name} 연결맵 — 노드 ${MAP_NODES.length}종, 엣지 ${edges.length}건. 실선은 실제 연결, 점선은 잠재 연결입니다.`}</title>
        <MapEdgeLines
          edges={edges}
          stageLinkById={stageLinkById}
          positions={positions}
          highlightedAxisNodes={highlightedAxisNodes}
        />

        {MAP_NODES.map((node) => {
          const actorCount = region.actor_counts.find(
            (row) => row.label === node.actorCountLabel,
          );
          return (
            <MapNodeMarker
              key={node.id}
              label={node.label}
              count={actorCount?.count}
              x={node.x}
              y={node.y}
              buyingPower={buyingPowerByNode[node.id]}
              isSelected={node.id === selectedId}
              isAxisHighlight={highlightedAxisNodes.has(node.id)}
              hasMemberOrg={memberNodeIds.has(node.id)}
              onSelect={() => onSelectNode(node.id)}
            />
          );
        })}
      </svg>

      <MapLegend highlightedAxisLabel={region.highlighted_gap_axis} />

      {/* 스크린리더용 텍스트 대체 설명(시각 SVG 보조) */}
      <p className="sr-only">
        연결 목록:{" "}
        {edges
          .map((edge) => {
            const link = stageLinkById.get(edge.stageLinkId);
            const from = nodeById.get(edge.fromNode);
            const to = nodeById.get(edge.toNode);
            return `${from?.label ?? edge.fromNode} → ${to?.label ?? edge.toNode} (${link?.status ?? ""})`;
          })
          .join(", ")}
      </p>
    </div>
  );
}
