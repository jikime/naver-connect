"use client";

import { Activity, ExternalLink, Lock, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useViewerContextStore } from "@/stores/viewer-context";
import { getEntityColor } from "./colors";
import type { EntityDetail } from "./types";

type Relation = EntityDetail["relations"][number];

interface EntityDetailPanelProps {
  entity: EntityDetail;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function EntityDetailPanel({
  entity,
  onClose,
  onNavigate,
}: EntityDetailPanelProps) {
  const role = useViewerContextStore((s) => s.role);
  const color = getEntityColor(entity.classKey);

  // ESC closes the panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Group relations by type so long lists stay scannable
  const relationGroups = useMemo(() => {
    const map = new Map<string, Relation[]>();
    for (const rel of entity.relations) {
      const arr = map.get(rel.typeLabel) ?? [];
      arr.push(rel);
      map.set(rel.typeLabel, arr);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [entity.relations]);

  return (
    <div
      className={
        "absolute z-40 flex flex-col bg-card/95 backdrop-blur-2xl shadow-2xl " +
        "inset-x-0 bottom-0 max-h-[75%] rounded-t-2xl border-t border-x animate-in slide-in-from-bottom-10 " +
        "md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:max-h-none md:w-96 md:rounded-none md:border-l md:border-x-0 md:border-t-0 md:slide-in-from-right-full"
      }
    >
      {/* Mobile drag-handle hint */}
      <div
        className="md:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0"
        aria-hidden="true"
      />

      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {entity.classLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="패널 닫기 (ESC)"
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-8 overscroll-contain">
        <div>
          <h2 className="text-2xl font-bold mb-4">{entity.label}</h2>

          <div className="space-y-3">
            {Object.entries(entity.properties).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-muted-foreground">{key}:</span>{" "}
                <span className="font-medium text-foreground">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Private Properties / Masking */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
          <div className="px-4 py-2 border-b border-primary/10 bg-primary/10 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              비공개 층 (Private Layer)
            </span>
          </div>
          <div className="p-4">
            {entity.masked ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5 text-primary/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {role
                    ? `현재 역할(${role})로는 접근할 수 없는 데이터입니다.`
                    : "로그인하지 않으면 공개층만 볼 수 있습니다."}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  운영자 또는 해당 엔티티의 소유자만 열람 가능합니다.
                </p>
              </div>
            ) : entity.privateProperties ? (
              <div className="space-y-3">
                {Object.entries(entity.privateProperties).map(
                  ([key, value]) => (
                    <div key={key} className="text-sm flex justify-between">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium text-primary-foreground">
                        {String(value)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                비공개 데이터가 없습니다.
              </p>
            )}
          </div>
        </div>

        {/* Relations, grouped by type */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> 관계망
            <Badge variant="secondary" className="font-mono text-[10px]">
              {entity.relations.length}
            </Badge>
          </h3>

          {entity.relations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              연결된 관계가 없습니다.
            </p>
          ) : (
            <div className="space-y-5">
              {relationGroups.map(([typeLabel, rels]) => (
                <div key={typeLabel}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-foreground/70">
                      {typeLabel}
                    </span>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px] px-1.5"
                    >
                      {rels.length}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {rels.map((rel, i) => (
                      <button
                        type="button"
                        key={`${rel.relationId}-${i}`}
                        onClick={() => onNavigate(rel.other.id)}
                        className="w-full text-left px-3 py-2 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all group flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground text-xs shrink-0">
                            {rel.direction === "out" ? "→" : "←"}
                          </span>
                          <span className="text-sm font-medium truncate">
                            {rel.other.label}
                          </span>
                          {rel.kind === "potential" && (
                            <Badge
                              variant="outline"
                              className="border-dashed border-primary/50 text-primary text-[10px] px-1.5 shrink-0"
                            >
                              잠재
                            </Badge>
                          )}
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          {rel.strength && (
                            <span className="text-xs tracking-widest text-primary">
                              {rel.strength}
                            </span>
                          )}
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
