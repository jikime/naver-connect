"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEntityColor } from "./colors";
import { getRecentNodes, type RecentNode } from "./recent-nodes";
import type { GalaxySearchEntity } from "./types";
import { useDebouncedValue } from "./use-debounced-value";

interface GalaxySearchProps {
  /** Called when the user picks an entity from the results. */
  onSelect: (entityId: string) => void;
  /** 공개 엔티티 목록(어댑터). react-query 대신 로컬 필터로 검색한다. */
  entities: GalaxySearchEntity[];
}

/**
 * Lightweight search overlay for the galaxy view.
 * Toggled with the magnifier button or the "/" shortcut; ESC closes it.
 */
export function GalaxySearch({ onSelect, entities }: GalaxySearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<RecentNode[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query, 250);
  const trimmed = debouncedQuery.trim();

  const results = useMemo<GalaxySearchEntity[]>(() => {
    if (trimmed.length === 0) return [];
    const q = trimmed.toLowerCase();
    return entities
      .filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          e.classLabel.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [entities, trimmed]);
  const isFetching = false;
  const isError = false;

  // "/" opens search from anywhere on the galaxy page (unless typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus the input and load recent nodes whenever the overlay opens
  useEffect(() => {
    if (open) {
      setRecent(getRecentNodes());
      inputRef.current?.focus();
    }
  }, [open]);

  // Keep the highlighted row in range as results change
  // biome-ignore lint/correctness/useExhaustiveDependencies: trimmed는 의도된 트리거 — 질의가 바뀌면 하이라이트 인덱스를 0으로 초기화
  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const pick = (id: string) => {
    onSelect(id);
    close();
  };

  // With no query, show recently viewed nodes instead of search results
  const showingRecent = trimmed.length === 0;
  const shown = showingRecent ? recent : (results ?? []).slice(0, 8);

  if (!open) {
    return (
      <div className="absolute top-16 right-4 md:top-4 md:right-4 z-30">
        <Button
          variant="outline"
          size="icon"
          aria-label="검색 (/)"
          className="h-9 w-9 rounded-lg bg-card/60 backdrop-blur-xl border-white/10"
          onClick={() => setOpen(true)}
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-16 md:top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
      <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="멤버·조직·분야 검색..."
            aria-label="은하 검색"
            className="pl-9 pr-16 bg-transparent border-0 focus-visible:ring-0 h-11"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                close();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(shown.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && shown[activeIndex]) {
                pick(shown[activeIndex].id);
              }
            }}
          />
          {isFetching && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
          <button
            type="button"
            aria-label="검색 닫기"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {shown.length > 0 || !showingRecent ? (
          <div className="border-t border-white/10 max-h-72 overflow-y-auto">
            {showingRecent && (
              <div className="px-4 pt-2.5 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                최근 본 노드
              </div>
            )}
            {!showingRecent && isError ? (
              <div className="px-4 py-3 text-sm text-destructive">
                검색에 실패했습니다. 다시 시도해주세요.
              </div>
            ) : shown.length === 0 && !isFetching ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                검색 결과가 없습니다.
              </div>
            ) : (
              shown.map((entity, i) => (
                <button
                  type="button"
                  key={entity.id}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    i === activeIndex ? "bg-accent/70" : "hover:bg-accent/50"
                  }`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(entity.id)}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getEntityColor(entity.classKey) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">
                      {entity.label}
                    </span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {entity.classLabel}
                      {"region" in entity && entity.region
                        ? ` · ${entity.region}`
                        : ""}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
