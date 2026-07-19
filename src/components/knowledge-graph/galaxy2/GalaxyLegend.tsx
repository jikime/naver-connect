"use client";

import { ListTree, X } from "lucide-react";
import { useState } from "react";
import { getEntityColor } from "./colors";
import type { GalaxySchemaClass } from "./types";

export function GalaxyLegend({ classes }: { classes: GalaxySchemaClass[] }) {
  const [open, setOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-card/70 backdrop-blur-md border border-white/10 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground shadow-xl transition-colors"
      >
        <ListTree className="w-3.5 h-3.5" /> 범례
      </button>
    );
  }

  return (
    <div className="w-52 rounded-xl bg-card/80 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          범례
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="범례 접기"
          className="p-2 -m-1 rounded hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-3.5 space-y-3 text-xs max-h-[45vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {classes.map((cls) => (
            <div key={cls.key} className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getEntityColor(cls.key) }}
              />
              <span className="truncate text-foreground/80">{cls.label}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <svg width="28" height="2" aria-hidden="true">
              <line
                x1="0"
                y1="1"
                x2="28"
                y2="1"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.5"
              />
            </svg>
            <span className="text-foreground/80">실제 연결</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="2" aria-hidden="true">
              <line
                x1="0"
                y1="1"
                x2="28"
                y2="1"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </svg>
            <span className="text-foreground/80">잠재 연결</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            분야 결합 강도
          </p>
          <div className="flex items-center gap-3 text-foreground/80">
            <span>● 강</span>
            <span>◐ 중</span>
            <span>○ 약</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-white/10 pt-2.5">
          분야는 항성입니다. 궤도는 안쪽부터 원천(회원·조직) 벨트 → 관계 → 기회
          → 사업 산출물 순서 — 바깥 궤도일수록 여문 성과입니다. 딜룸 행성에는
          고리가 있습니다. 휠·드래그로 확대/이동, 노드를 클릭하면 상세가
          열립니다.
        </p>
      </div>
    </div>
  );
}
