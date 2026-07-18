"use client";

// GraphFlow2D — @xyflow/react 2D 뷰. React Flow 공식 d3-force 패턴:
// forceSimulation을 라이브로 돌리며 노드 드래그 시 fx/fy로 고정(pinning)하고 나머지는 물리로 흐른다.
// 근거: team-lead A-v2("물리 시뮬레이션 중 노드 드래그", https://reactflow.dev d3-force 예제).
// 엣지: 실선(실제)/점선(잠재)/red(전환) + EdgeLabelRenderer 관계명 라벨(겹침 방지 위해 hover·선택 시만 표시).
// prefers-reduced-motion이면 사전 계산 레이아웃으로 고정 렌더(라이브 시뮬레이션 생략).

import {
  Background,
  BaseEdge,
  Controls,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getStraightPath,
  MarkerType,
  MiniMap,
  type Node,
  type OnNodeDrag,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KGNodeType, KnowledgeGraph } from "@/types";
import { AnimatedStoryEdge } from "./AnimatedStoryEdge";
import {
  buildAdjacency,
  computeLayout,
  KG_EMPHASIS_COLOR,
  KG_TYPE_META,
  nodeWidth,
} from "./graph-meta";
import { KgFlowNode, type KgFlowNodeData } from "./KgFlowNode";
import type { StoryFrame } from "./story";

interface RelEdgeData {
  rel: string;
  color: string;
  emphasis: boolean;
  showLabel: boolean;
  [key: string]: unknown;
}

function RelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const [path, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const d = data as RelEdgeData | undefined;
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {d?.showLabel && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute rounded-full border border-border bg-card px-1.5 py-0.5 text-[11px] font-semibold"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color: d.emphasis ? KG_EMPHASIS_COLOR : "var(--foreground)",
            }}
          >
            {d.rel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = { kg: KgFlowNode };
const edgeTypes = { rel: RelEdge, story: AnimatedStoryEdge };

function edgeVisual(kind: "real" | "potential", emphasis: boolean) {
  if (emphasis) return { color: KG_EMPHASIS_COLOR, width: 2.4, dash: "7 5" };
  if (kind === "potential")
    return { color: "var(--guud-text-subtle)", width: 1.4, dash: "6 5" };
  return { color: "var(--guud-text-strong)", width: 1.5, dash: undefined };
}

function collideRadius(n: Node<KgFlowNodeData>) {
  return Math.max((n.data.width ?? 120) / 2, 34) + 16;
}

interface SimNode {
  id: string;
  type: KGNodeType;
  r: number;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

/** React Flow 공식 패턴의 라이브 d3-force + 드래그 고정 훅. */
function useForceSimulation(enabled: boolean) {
  const { getNodes, setNodes, getEdges } = useReactFlow<Node<KgFlowNodeData>>();
  const initialized = useNodesInitialized();
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const draggingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!initialized || !enabled) return;
    const rfNodes = getNodes();
    if (rfNodes.length === 0) return;
    const simNodes: SimNode[] = rfNodes.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      r: collideRadius(n),
      x: n.position.x,
      y: n.position.y,
    }));
    const map = new Map(simNodes.map((s) => [s.id, s]));
    simNodesRef.current = map;
    const cx = simNodes.reduce((a, s) => a + s.x, 0) / simNodes.length;
    const cy = simNodes.reduce((a, s) => a + s.y, 0) / simNodes.length;
    const links = getEdges().map((e) => ({
      source: e.source,
      target: e.target,
    }));

    const sim = forceSimulation<SimNode>(simNodes)
      .force("charge", forceManyBody<SimNode>().strength(-520))
      .force(
        "link",
        forceLink<SimNode, { source: string; target: string }>(links)
          .id((d) => d.id)
          .distance(130)
          .strength(0.14),
      )
      .force(
        "collide",
        forceCollide<SimNode>()
          .radius((d) => d.r)
          .strength(0.9),
      )
      .force(
        "x",
        forceX<SimNode>(cx).strength((d) =>
          d.type === "project" ? 0.22 : 0.05,
        ),
      )
      .force(
        "y",
        forceY<SimNode>(cy).strength((d) =>
          d.type === "project" ? 0.22 : 0.05,
        ),
      )
      .on("tick", () => {
        setNodes((nds) =>
          nds.map((n) => {
            const s = map.get(n.id);
            if (!s || draggingRef.current.has(n.id)) return n;
            return { ...n, position: { x: s.x, y: s.y } };
          }),
        );
      });
    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [initialized, enabled, getNodes, getEdges, setNodes]);

  const onNodeDragStart: OnNodeDrag<Node<KgFlowNodeData>> = (_, node) => {
    draggingRef.current.add(node.id);
    const s = simNodesRef.current.get(node.id);
    if (s) {
      s.fx = node.position.x;
      s.fy = node.position.y;
    }
    simRef.current?.alphaTarget(0.3).restart();
  };
  const onNodeDrag: OnNodeDrag<Node<KgFlowNodeData>> = (_, node) => {
    const s = simNodesRef.current.get(node.id);
    if (s) {
      s.fx = node.position.x;
      s.fy = node.position.y;
    }
  };
  const onNodeDragStop: OnNodeDrag<Node<KgFlowNodeData>> = (_, node) => {
    draggingRef.current.delete(node.id);
    const s = simNodesRef.current.get(node.id);
    if (s) {
      s.fx = null;
      s.fy = null;
    }
    simRef.current?.alphaTarget(0);
  };

  return { onNodeDragStart, onNodeDrag, onNodeDragStop };
}

function Flow({
  graph,
  selectedId,
  onSelect,
  hidden,
  story,
}: {
  graph: KnowledgeGraph;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  hidden: Set<KGNodeType>;
  story: StoryFrame | null;
}) {
  const { setNodes, setEdges } = useReactFlow<Node<KgFlowNodeData>, Edge>();
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const layout = useMemo(
    () => computeLayout(graph.nodes, graph.edges),
    [graph],
  );
  const adjacency = useMemo(() => buildAdjacency(graph.edges), [graph]);
  const typeById = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n.type])),
    [graph],
  );
  const edgeBase = useMemo(() => {
    const m = new Map<string, ReturnType<typeof edgeVisual>>();
    for (const e of graph.edges) m.set(e.id, edgeVisual(e.kind, e.emphasis));
    return m;
  }, [graph]);

  const defaultNodes = useMemo<Node<KgFlowNodeData>[]>(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: "kg",
        position: layout.get(n.id) ?? { x: 0, y: 0 },
        data: {
          label: n.label,
          nodeType: n.type,
          width: nodeWidth(n),
          dim: false,
          selected: false,
        },
      })),
    [graph, layout],
  );

  const defaultEdges = useMemo<Edge[]>(
    () =>
      graph.edges.map((e) => {
        const v = edgeVisual(e.kind, e.emphasis);
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: "rel",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: v.color,
            width: 16,
            height: 16,
          },
          style: {
            stroke: v.color,
            strokeWidth: v.width,
            strokeDasharray: v.dash,
          },
          data: {
            rel: e.rel,
            color: v.color,
            emphasis: e.emphasis,
            showLabel: false,
          } satisfies RelEdgeData,
        } satisfies Edge;
      }),
    [graph],
  );

  // 물리 시뮬레이션(라이브) — reduced-motion이거나 스토리 재생 중이면 고정.
  const dragHandlers = useForceSimulation(!reduced && !story);

  // 스토리 프레임 / 선택·필터·hover → 노드·엣지 속성 반영(위치는 시뮬레이션이 소유).
  useEffect(() => {
    if (story) {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          hidden: !story.revealNodes.has(n.id),
          data: {
            ...n.data,
            dim: false,
            selected: story.focusNodes.has(n.id),
          },
        })),
      );
      setEdges((eds) =>
        eds.map((e) => {
          const show = story.revealEdges.has(e.id);
          const solid = story.solidEdges.has(e.id);
          const particle = story.particleEdges.has(e.id);
          const base = (e.data as RelEdgeData).color;
          const stroke = particle
            ? KG_EMPHASIS_COLOR
            : solid
              ? "var(--guud-text-strong)"
              : base;
          return {
            ...e,
            hidden: !show,
            type: particle ? "story" : "rel",
            selectable: false,
            data: {
              ...(e.data as RelEdgeData),
              showLabel: show && story.labelEdges.has(e.id),
            },
            style: {
              stroke,
              strokeWidth: particle ? 2.6 : solid ? 1.9 : 1.4,
              strokeDasharray: solid || particle ? undefined : "6 5",
              opacity: 1,
            },
          };
        }),
      );
      return;
    }

    const neighbors = selectedId
      ? (adjacency.get(selectedId) ?? new Set<string>())
      : null;
    setNodes((nds) =>
      nds.map((n) => {
        const keep = !selectedId || n.id === selectedId || neighbors?.has(n.id);
        return {
          ...n,
          hidden: hidden.has(n.data.nodeType),
          data: {
            ...n.data,
            dim: Boolean(selectedId) && !keep,
            selected: n.id === selectedId,
          },
        };
      }),
    );
    setEdges((eds) =>
      eds.map((e) => {
        const v = edgeBase.get(e.id);
        const incident =
          !selectedId || e.source === selectedId || e.target === selectedId;
        const hiddenEdge =
          hidden.has(typeById.get(e.source) as KGNodeType) ||
          hidden.has(typeById.get(e.target) as KGNodeType);
        const showLabel =
          hoveredEdge === e.id ||
          Boolean(
            selectedId && (e.source === selectedId || e.target === selectedId),
          );
        return {
          ...e,
          hidden: hiddenEdge,
          type: "rel",
          selectable: true,
          data: { ...(e.data as RelEdgeData), showLabel, color: v?.color },
          style: {
            stroke: v?.color,
            strokeWidth: v?.width,
            strokeDasharray: v?.dash,
            opacity: selectedId ? (incident ? 1 : 0.08) : 1,
          },
        };
      }),
    );
  }, [
    story,
    selectedId,
    hidden,
    hoveredEdge,
    adjacency,
    typeById,
    edgeBase,
    setNodes,
    setEdges,
  ]);

  return (
    <ReactFlow
      defaultNodes={defaultNodes}
      defaultEdges={defaultEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={story ? undefined : (_, node) => onSelect(node.id)}
      onNodeDragStart={dragHandlers.onNodeDragStart}
      onNodeDrag={dragHandlers.onNodeDrag}
      onNodeDragStop={dragHandlers.onNodeDragStop}
      onEdgeMouseEnter={
        story ? undefined : (_, edge) => setHoveredEdge(edge.id)
      }
      onEdgeMouseLeave={story ? undefined : () => setHoveredEdge(null)}
      onPaneClick={story ? undefined : () => onSelect(null)}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.3}
      maxZoom={2.2}
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
      edgesReconnectable={false}
      nodesDraggable={!story}
      panOnDrag={!story}
      zoomOnScroll={!story}
      zoomOnDoubleClick={!story}
      elementsSelectable={!story}
      className="bg-guud-surface-image"
    >
      <Background gap={22} size={1} color="var(--guud-hairline)" />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n) =>
          KG_TYPE_META[(n.data as KgFlowNodeData).nodeType]?.color ?? "#999"
        }
        maskColor="color-mix(in oklch, var(--muted) 60%, transparent)"
      />
    </ReactFlow>
  );
}

export function GraphFlow2D(props: {
  graph: KnowledgeGraph;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  hidden: Set<KGNodeType>;
  story?: StoryFrame | null;
}) {
  return (
    <ReactFlowProvider>
      <Flow {...props} story={props.story ?? null} />
    </ReactFlowProvider>
  );
}
