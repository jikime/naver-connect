"use client";

// DistrictMapView — 한빛구 추상 구역 지도 뷰(T-020).
// 근거: TASKS.md T-020(격차 리포트 지역 맵 뷰), ARCHITECTURE.md ADR-02 원칙 확장
//
// 한빛구는 가상 지역이라 실제 TopoJSON 경계 데이터가 없다 — 외곽선·구역 블록 전부
// 손수 그린 정적 도형(둥근 사각형)으로 의도적으로 "추상화된 지도"임을 드러낸다.
// ConnectionMap과 같은 6노드·엣지 데이터를 공유하되, 배치를 "구역"(돌봄·의료·주거·
// 교통권역) 기준으로 바꿔 공간적 직관을 준다. 노드 마커·엣지·범례는 ConnectionMap과
// 동일 컴포넌트(MapNodeMarker·MapEdgeLines·MapLegend)를 재사용해 두 뷰가 "같은 데이터의
// 다른 배치"임이 시각적으로 일관되게 읽히도록 한다.

import { useMemo } from "react";
import type { Region, StageLink } from "@/types";
import { MapEdgeLines } from "./MapEdgeLines";
import { MapLegend } from "./MapLegend";
import { MapNodeMarker } from "./MapNodeMarker";
import {
  buildMapEdges,
  DISTRICT_BOUNDARY,
  DISTRICT_GREEN_PATCHES,
  DISTRICT_NODE_POSITIONS,
  DISTRICT_VIEWBOX,
  DISTRICT_ZONES,
  MAP_NODES,
  resolveHighlightedAxisNodes,
} from "./map-topology";

function DistrictNode({
  nodeId,
  region,
  isSelected,
  isAxisHighlight,
  hasMemberOrg,
  onSelect,
}: {
  nodeId: string;
  region: Region;
  isSelected: boolean;
  isAxisHighlight: boolean;
  hasMemberOrg: boolean;
  onSelect: () => void;
}) {
  const node = MAP_NODES.find((n) => n.id === nodeId);
  const position = DISTRICT_NODE_POSITIONS[nodeId];
  if (!node || !position) return null;
  const actorCount = region.actor_counts.find(
    (row) => row.label === node.actorCountLabel,
  );

  return (
    <MapNodeMarker
      label={node.label}
      count={actorCount?.count}
      x={position.x}
      y={position.y}
      isSelected={isSelected}
      isAxisHighlight={isAxisHighlight}
      hasMemberOrg={hasMemberOrg}
      onSelect={onSelect}
    />
  );
}

export function DistrictMapView({
  region,
  stageLinks,
  memberNodeIds,
  selectedId,
  onSelectNode,
}: {
  region: Region;
  stageLinks: StageLink[];
  memberNodeIds: Set<string>;
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

  return (
    <div className="border border-guud-hairline p-2">
      <svg
        viewBox={`0 0 ${DISTRICT_VIEWBOX.width} ${DISTRICT_VIEWBOX.height}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>
          {`${region.name} 지역 맵(추상화) — 돌봄·의료·주거·교통 4권역에 같은 6노드를 배치했습니다. 실선은 실제 연결, 점선은 잠재 연결입니다.`}
        </title>

        {/* 한빛구 외곽 경계 — 가상 지역이라 실제 경계 데이터 없이 손수 그린 둥근 사각형(장식) */}
        <rect
          x={DISTRICT_BOUNDARY.x}
          y={DISTRICT_BOUNDARY.y}
          width={DISTRICT_BOUNDARY.width}
          height={DISTRICT_BOUNDARY.height}
          rx={48}
          className="fill-background stroke-guud-hairline"
          strokeWidth={2}
        />

        {/* 구역 블록 — canvas 바탕 + hairline 경계, 구분은 라벨이 맡는다(NFR-05 "색보다 라벨") */}
        {DISTRICT_ZONES.map((zone) => (
          <g key={zone.id}>
            <rect
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              rx={20}
              className={`${zone.fillClassName} stroke-guud-hairline`}
              strokeWidth={1}
            />
            <text
              x={zone.x + 16}
              y={zone.y + 24}
              className="fill-guud-text-muted-2 text-[12px] font-semibold"
            >
              {zone.label}
            </text>
          </g>
        ))}

        {/* "동네" 느낌의 장식용 녹지 패치 — header-band 베이지를 절제해서 얹는다(데이터 아님) */}
        {DISTRICT_GREEN_PATCHES.map((patch) => (
          <circle
            key={patch.id}
            cx={patch.cx}
            cy={patch.cy}
            r={patch.r}
            className="fill-guud-header-band/70"
          />
        ))}

        <MapEdgeLines
          edges={edges}
          stageLinkById={stageLinkById}
          positions={DISTRICT_NODE_POSITIONS}
          highlightedAxisNodes={highlightedAxisNodes}
        />

        {DISTRICT_ZONES.flatMap((zone) =>
          zone.nodeIds.map((nodeId) => (
            <DistrictNode
              key={nodeId}
              nodeId={nodeId}
              region={region}
              isSelected={nodeId === selectedId}
              isAxisHighlight={highlightedAxisNodes.has(nodeId)}
              hasMemberOrg={memberNodeIds.has(nodeId)}
              onSelect={() => onSelectNode(nodeId)}
            />
          )),
        )}
      </svg>

      <MapLegend highlightedAxisLabel={region.highlighted_gap_axis} />

      <p className="sr-only">
        지역 맵 구역: {DISTRICT_ZONES.map((zone) => zone.label).join(", ")}.
        연결 목록:{" "}
        {edges
          .map(
            (edge) =>
              `${edge.fromNode} → ${edge.toNode} (${stageLinkById.get(edge.stageLinkId)?.status ?? ""})`,
          )
          .join(", ")}
      </p>
    </div>
  );
}
