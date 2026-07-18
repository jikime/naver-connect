"use client";

// ConnectionMap — 손수 짠 인라인 SVG 연결맵(FR-GR-02/04, ADR-02).
// 근거: ARCHITECTURE.md ADR-02·NFR-05·§18, TASKS.md T-018
// Canvas/react-flow 대신 좌표 사전계산 + React가 그리는 SVG(ADR-02 결정). 노드는
// 포커서블 <g role="button" tabIndex>, 실제/잠재는 색+stroke-dasharray+범례 텍스트로
// 삼중 부호화한다(색맹 대응, NFR-05). 좌표가 상수라 리렌더마다 재계산하지 않는다.

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Organization, Region, StageLink } from "@/types";
import {
  buildMapEdges,
  MAP_NODES,
  resolveHighlightedAxisNodes,
} from "./map-topology";
import { NodeDetailPanel } from "./NodeDetailPanel";

const NODE_WIDTH = 132;
const NODE_HEIGHT = 52;

export function ConnectionMap({
  region,
  stageLinks,
  orgs,
}: {
  region: Region;
  stageLinks: StageLink[];
  orgs: Organization[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const edges = useMemo(() => buildMapEdges(stageLinks), [stageLinks]);
  const highlightedAxisNodes = useMemo(
    () => resolveHighlightedAxisNodes(region.highlighted_gap_axis),
    [region.highlighted_gap_axis],
  );
  const stageLinkById = useMemo(
    () => new Map(stageLinks.map((link) => [link.id, link])),
    [stageLinks],
  );
  const nodeById = useMemo(() => new Map(MAP_NODES.map((n) => [n.id, n])), []);

  const selectedNode = selectedId ? (nodeById.get(selectedId) ?? null) : null;

  function selectNode(id: string) {
    setSelectedId((current) => (current === id ? null : id));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="border border-guud-hairline p-2">
        <svg
          viewBox="0 0 640 440"
          className="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <title>{`${region.name} 연결맵 — 노드 ${MAP_NODES.length}종, 엣지 ${edges.length}건. 실선은 실제 연결, 점선은 잠재 연결입니다.`}</title>
          {/* 엣지 — 실제=실선, 잠재=점선. 공백 축(돌봄↔주거)은 destructive 색으로 추가 강조. */}
          {edges.map((edge) => {
            const from = nodeById.get(edge.fromNode);
            const to = nodeById.get(edge.toNode);
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

          {/* 노드 */}
          {MAP_NODES.map((node) => {
            const actorCount = region.actor_counts.find(
              (row) => row.label === node.actorCountLabel,
            );
            const isSelected = node.id === selectedId;
            const isAxisNode = highlightedAxisNodes.has(node.id);
            const x = node.x - NODE_WIDTH / 2;
            const y = node.y - NODE_HEIGHT / 2;

            return (
              // biome-ignore lint/a11y/useSemanticElements: SVG 노드는 <button>으로 대체 불가 — ADR-02 포커서블 <g role="button"> 결정
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${node.label}${actorCount ? `, 규모 ${actorCount.count}` : ""}. 선택하면 주체 상세를 봅니다.`}
                onClick={() => selectNode(node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectNode(node.id);
                  }
                }}
                className="group cursor-pointer outline-none"
              >
                <title>{node.label}</title>
                <rect
                  x={x}
                  y={y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={0}
                  className={cn(
                    "fill-card transition-colors group-hover:fill-muted",
                    isSelected
                      ? "stroke-ring"
                      : isAxisNode
                        ? "stroke-destructive"
                        : "stroke-border",
                  )}
                  strokeWidth={isSelected ? 3 : isAxisNode ? 2 : 1}
                  strokeDasharray={
                    !isSelected && isAxisNode ? "4 3" : undefined
                  }
                />
                <text
                  x={node.x}
                  y={node.y - 4}
                  textAnchor="middle"
                  className="fill-foreground text-[13px] font-semibold"
                >
                  {node.label}
                </text>
                {actorCount && (
                  <text
                    x={node.x}
                    y={node.y + 15}
                    textAnchor="middle"
                    className="fill-guud-text-muted-2 text-[11px]"
                  >
                    규모 {actorCount.count}
                  </text>
                )}
                {/* 형태 이중성(guud): 카드형 노드는 각진 rect, 선택 표시는 원형 pill로 이중 형태 언어를 유지 */}
                {isSelected && (
                  <circle
                    cx={x + NODE_WIDTH - 8}
                    cy={y + 8}
                    r={5}
                    className="fill-primary"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* 범례 — 색+패턴+텍스트 삼중 부호화(NFR-05) */}
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-guud-hairline pt-2 text-xs text-guud-text-muted-2">
          <li className="flex items-center gap-1.5">
            <svg width="20" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="20"
                y2="4"
                strokeWidth={2}
                className="stroke-foreground"
              />
            </svg>
            실제 연결
          </li>
          <li className="flex items-center gap-1.5">
            <svg width="20" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="20"
                y2="4"
                strokeWidth={2}
                strokeDasharray="4 3"
                className="stroke-guud-text-muted-2"
              />
            </svg>
            잠재 연결(공백)
          </li>
          <li className="flex items-center gap-1.5">
            <svg width="20" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="20"
                y2="4"
                strokeWidth={3}
                strokeDasharray="4 3"
                className="stroke-destructive"
              />
            </svg>
            완전 공백 축({region.highlighted_gap_axis})
          </li>
        </ul>

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

      <NodeDetailPanel node={selectedNode} region={region} orgs={orgs} />
    </div>
  );
}
