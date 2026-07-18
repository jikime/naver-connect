"use client";

// KgDetailPanel — 선택 노드의 공개-안전 상세. BR-01: DAL이 투영한 detail만 렌더한다.

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KGNode } from "@/types";
import { KG_TYPE_META } from "./graph-meta";

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-guud-surface-image px-2 py-0.5 text-[11px] font-semibold text-foreground">
      {children}
    </span>
  );
}

export function KgDetailPanel({
  node,
  onClose,
  className,
}: {
  node: KGNode;
  onClose: () => void;
  className?: string;
}) {
  const meta = KG_TYPE_META[node.type];
  const d = node.detail;
  return (
    <aside
      aria-label={`${node.label} 상세`}
      className={cn("flex flex-col bg-card", className)}
    >
      <div className="relative border-b border-guud-hairline p-4">
        <Badge
          className="rounded-full border-transparent text-white"
          style={{ background: meta.color }}
        >
          {meta.ko}
        </Badge>
        <button
          type="button"
          onClick={onClose}
          aria-label="상세 닫기"
          className="absolute right-3 top-3 grid size-8 place-items-center border border-border text-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden />
        </button>
        <h3 className="mt-2 font-heading text-lg font-bold leading-tight text-foreground">
          {node.label}
        </h3>
        {d.subtitle && (
          <p className="mt-0.5 text-xs text-guud-text-muted-2">{d.subtitle}</p>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {d.rows?.map((r) => (
          <div key={r.k}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-guud-text-muted-2">
              {r.k}
            </p>
            <p className="text-sm text-foreground">{r.v}</p>
          </div>
        ))}

        {d.quote && (
          <p className="border-l-2 border-destructive bg-guud-surface-image px-3 py-2 text-sm leading-relaxed text-foreground">
            {d.quote}
          </p>
        )}

        {d.gates && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-guud-text-muted-2">
              게이트 통과
            </p>
            <div className="flex gap-1.5">
              {d.gates.map((g) => (
                <span
                  key={g.label}
                  className={cn(
                    "flex-1 border py-1 text-center text-[11px] font-bold",
                    g.passed
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-guud-text-subtle",
                  )}
                >
                  {g.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {d.tags?.map((t) => (
          <div key={t.k}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-guud-text-muted-2">
              {t.k}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {t.items.map((it) => (
                <Tag key={it}>{it}</Tag>
              ))}
            </div>
          </div>
        ))}

        {d.list && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-guud-text-muted-2">
              {d.list.k}
            </p>
            <ul className="space-y-1 text-[13px] leading-relaxed text-foreground">
              {d.list.items.map((it) => (
                <li
                  key={it}
                  className="border-b border-dashed border-guud-hairline pb-1"
                >
                  {it}
                </li>
              ))}
            </ul>
          </div>
        )}

        {d.note && (
          <p className="text-[13px] text-guud-text-muted-2">{d.note}</p>
        )}
      </div>
    </aside>
  );
}
