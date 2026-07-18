"use client";

// KgFlowNode — React Flow용 커스텀 노드. guud 카드 언어(각진 border·bg-card)에
// 유형 색 점(pill)을 얹은 shadcn 스타일 노드. 근거: team-lead A-v2("shadcn 노드").

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { KGNodeType } from "@/types";
import { KG_TYPE_META } from "./graph-meta";

export interface KgFlowNodeData {
  label: string;
  nodeType: KGNodeType;
  width: number;
  dim: boolean;
  selected: boolean;
  [key: string]: unknown;
}

const centeredHandle = { left: "50%", top: "50%", opacity: 0 } as const;

export function KgFlowNode({ data }: NodeProps) {
  const { label, nodeType, width, dim, selected } = data as KgFlowNodeData;
  const meta = KG_TYPE_META[nodeType];
  return (
    <div
      style={{ width }}
      className={cn(
        "relative border bg-card px-3 py-2 text-left transition-opacity",
        selected
          ? "border-ring shadow-[0_0_0_2px_var(--ring)]"
          : "border-border",
        dim && "opacity-25",
      )}
    >
      {/* 엣지 부착용 중앙 핸들(비가시). 방향 화살표는 엣지 markerEnd가 그린다. */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={centeredHandle}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={centeredHandle}
      />
      <div className="flex items-center gap-1.5">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: meta.color }}
          aria-hidden
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-guud-text-strong">
          {meta.ko}
        </span>
      </div>
      <div className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
        {label}
      </div>
    </div>
  );
}
