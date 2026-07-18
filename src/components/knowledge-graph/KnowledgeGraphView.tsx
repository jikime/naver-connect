"use client";

// KnowledgeGraphView — /knowledge-graph 셸. 범례=필터 + 기회 스토리 모드(#19, 속도 조절) +
// 선택 상세 패널. 2D React Flow 뷰. 그래프 데이터는 서버(getKnowledgeGraph, DAL)에서
// 공개층으로만 투영돼 내려온다.
// (3D 은하 뷰는 사용자 지시로 제거·아카이브: artifacts/archive/knowledge-graph-3d/, #24)

import { Pause, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KGNodeType, KnowledgeGraph } from "@/types";
import { GraphFlow2D } from "./GraphFlow2D";
import { KG_TYPE_META, KG_TYPE_ORDER } from "./graph-meta";
import { KgDetailPanel } from "./KgDetailPanel";
import { buildStory } from "./story";

// 스텝별 자동 재생 시간(ms) — 성사(2)·마무리(4)는 조금 길게 머문다.
const STEP_MS = [2600, 3800, 4400, 3800, 4600];

export function KnowledgeGraphView({ graph }: { graph: KnowledgeGraph }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<KGNodeType>>(new Set());

  const [storyOn, setStoryOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState(1); // 연대기 재생 속도 0.5×/1×/2×

  const story = useMemo(() => buildStory(graph), [graph]);
  const frames = story.frames;
  const frame = storyOn ? (frames[step] ?? null) : null;
  const lastStep = frames.length - 1;

  const counts = useMemo(() => {
    const c = new Map<KGNodeType, number>();
    for (const n of graph.nodes) c.set(n.type, (c.get(n.type) ?? 0) + 1);
    return c;
  }, [graph]);

  const nodeById = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n])),
    [graph],
  );
  const selectedNode = selectedId ? (nodeById.get(selectedId) ?? null) : null;

  // 자동 재생 — 마지막 스텝에서 멈춘다.
  useEffect(() => {
    if (!storyOn || !playing) return;
    if (step >= lastStep) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(
      () => setStep((s) => s + 1),
      (STEP_MS[step] ?? 3600) / speed,
    );
    return () => clearTimeout(t);
  }, [storyOn, playing, step, lastStep, speed]);

  function toggleType(t: KGNodeType) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        next.delete(t);
      } else {
        next.add(t);
        if (selectedId && nodeById.get(selectedId)?.type === t) {
          setSelectedId(null);
        }
      }
      return next;
    });
  }

  function startStory() {
    setSelectedId(null);
    setStep(0);
    setStoryOn(true);
    setPlaying(true);
  }
  function exitStory() {
    setStoryOn(false);
    setPlaying(false);
    setStep(0);
  }
  function togglePlay() {
    if (step >= lastStep && !playing) {
      setStep(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }

  const meta = graph.meta;

  return (
    <div className="flex flex-col gap-3">
      {/* 툴바 — 스토리 재생 중엔 재생 컨트롤로 교체 */}
      {storyOn && frame ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-guud-hairline bg-card px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="default"
              onClick={togglePlay}
              aria-label={playing ? "일시정지" : "재생"}
            >
              {playing ? (
                <Pause className="size-4" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                setStep(0);
                setPlaying(true);
              }}
              aria-label="처음부터"
            >
              <RotateCcw className="size-4" aria-hidden />
            </Button>
          </div>

          <fieldset
            className="m-0 inline-flex min-w-0 overflow-hidden border border-border p-0"
            aria-label="재생 속도"
          >
            {([0.5, 1, 2] as const).map((sp) => (
              <Button
                key={sp}
                size="xs"
                variant={speed === sp ? "default" : "ghost"}
                aria-pressed={speed === sp}
                onClick={() => setSpeed(sp)}
                className="rounded-none border-0 tabular-nums"
              >
                {sp}×
              </Button>
            ))}
          </fieldset>

          <fieldset
            className="m-0 flex min-w-0 items-center gap-1.5 border-0 p-0"
            aria-label="스토리 단계"
          >
            {frames.map((f, i) => (
              <button
                key={f.title}
                type="button"
                aria-label={`${i + 1}. ${f.title}`}
                aria-current={i === step ? "step" : undefined}
                onClick={() => {
                  setStep(i);
                  setPlaying(false);
                }}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  i === step
                    ? "w-6 bg-destructive"
                    : i < step
                      ? "w-2.5 bg-foreground"
                      : "w-2.5 bg-guud-hairline",
                )}
              />
            ))}
          </fieldset>

          <div className="min-w-40 flex-1">
            <p className="text-xs font-bold text-foreground">
              {step + 1}/{frames.length} · {frame.title}
            </p>
            <p className="line-clamp-2 text-xs text-guud-text-muted-2">
              {frame.caption}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={exitStory}
            className="gap-1.5"
          >
            <X className="size-4" aria-hidden />
            종료
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <fieldset
            className="m-0 flex min-w-0 flex-wrap items-center gap-1.5 border-0 p-0"
            aria-label="노드 유형 필터"
          >
            {KG_TYPE_ORDER.map((t) => {
              const off = hidden.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={!off}
                  onClick={() => toggleType(t)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-opacity",
                    "border-border bg-card text-foreground hover:bg-muted",
                    off && "opacity-40",
                  )}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: KG_TYPE_META[t].color }}
                    aria-hidden
                  />
                  {KG_TYPE_META[t].ko}
                  <span className="text-guud-text-muted-2">
                    {counts.get(t) ?? 0}
                  </span>
                </button>
              );
            })}
          </fieldset>

          <Button
            size="sm"
            variant="outline"
            onClick={startStory}
            className="ml-auto gap-1.5"
          >
            <Play className="size-4" aria-hidden />
            스토리
          </Button>
        </div>
      )}

      {/* 스테이지 */}
      <div className="relative h-[68vh] min-h-[520px] w-full overflow-hidden border border-guud-hairline">
        <div className="absolute inset-0">
          <GraphFlow2D
            graph={graph}
            selectedId={selectedId}
            onSelect={setSelectedId}
            hidden={hidden}
            story={frame}
          />
        </div>

        {/* 커버리지 카드(마무리 스텝) */}
        {frame?.showCoverage && meta && (
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 border border-guud-hairline bg-card px-5 py-3 text-center shadow-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-guud-text-muted-2">
              {meta.region} 연결 커버리지
            </p>
            <p className="mt-0.5">
              <span className="font-heading text-3xl font-bold text-destructive">
                {meta.coverageRate}%
              </span>
            </p>
            <p className="text-xs text-guud-text-muted-2">
              실제 {meta.coverageActual} / 잠재 {meta.coveragePotential} 연결
            </p>
          </div>
        )}

        {selectedNode && !storyOn && (
          <KgDetailPanel
            node={selectedNode}
            onClose={() => setSelectedId(null)}
            className={cn(
              "absolute z-10 shadow-xl",
              "inset-x-0 bottom-0 h-[58%] border-t border-guud-hairline",
              "md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-[340px] md:border-l md:border-t-0",
            )}
          />
        )}
      </div>

      {/* 라인 부호화 범례(색+패턴+텍스트 삼중, NFR-05 정신) */}
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-guud-text-muted-2">
        <li className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden="true">
            <line
              x1="0"
              y1="4"
              x2="22"
              y2="4"
              strokeWidth={2}
              className="stroke-guud-text-strong"
            />
          </svg>
          실제 연결
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden="true">
            <line
              x1="0"
              y1="4"
              x2="22"
              y2="4"
              strokeWidth={2}
              strokeDasharray="6 4"
              className="stroke-guud-text-subtle"
            />
          </svg>
          잠재 연결
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden="true">
            <line
              x1="0"
              y1="4"
              x2="22"
              y2="4"
              strokeWidth={2.4}
              strokeDasharray="7 4"
              className="stroke-destructive"
            />
          </svg>
          전환 기회(잠재→실제)
        </li>
        <li className="text-guud-text-subtle">
          {storyOn
            ? "스토리 재생 중 — 단계 표시를 눌러 이동, 종료로 평상 그래프 복귀"
            : "노드 크기 = 연결 중심성 · 노드 클릭 시 상세, 드래그·휠로 이동/확대"}
        </li>
      </ul>
    </div>
  );
}
