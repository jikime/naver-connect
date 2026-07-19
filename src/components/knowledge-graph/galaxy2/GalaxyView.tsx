"use client";

// GalaxyView(#36) — connect-ontology galaxy.tsx 오케스트레이션 이식. wouter→next/navigation,
// react-query→서버 DAL props + 로컬 어댑터(@/lib/knowledge-graph-galaxy)로 치환. 캔버스·검색·
// 범례·HUD·상세 패널·시네마 재생을 조립한다. ?entityId 동기화로 브라우저 뒤로가기를 지원.
//
// 다크 스테이지 예외: 캔버스는 원본 그대로 심우주(#02040d, colors.ts) — guud/hana 라이트
// 크로스워크의 의도적 예외(team-lead #36 승인). 오버레이 chrome은 우리 shadcn/guud 토큰 사용.

import {
  Maximize2,
  Minus,
  Orbit,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  toEntityDetail,
  toGalaxyGraph,
  toGalaxySchema,
  toGalaxyStats,
  toSearchEntities,
} from "@/lib/knowledge-graph-galaxy";
import { cn } from "@/lib/utils";
import type { KnowledgeGraph } from "@/types";
import { buildStory } from "../story";
import { EcosystemHUD } from "./EcosystemHUD";
import { EntityDetailPanel } from "./EntityDetailPanel";
import { GalaxyCanvas, type GalaxyCanvasHandle } from "./GalaxyCanvas";
import { GalaxyLegend } from "./GalaxyLegend";
import { GalaxySearch } from "./GalaxySearch";
import { addRecentNode } from "./recent-nodes";

const SPEEDS = [0.5, 1, 2] as const;
const STEP_MS = 5500;

export function GalaxyView({ graph }: { graph: KnowledgeGraph }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedNodeId = searchParams.get("entityId");

  const canvasHandle = useRef<GalaxyCanvasHandle>(null);
  const [cinemaOn, setCinemaOn] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const galaxy = useMemo(() => toGalaxyGraph(graph), [graph]);
  const stats = useMemo(() => toGalaxyStats(graph), [graph]);
  const schema = useMemo(() => toGalaxySchema(graph), [graph]);
  const entities = useMemo(() => toSearchEntities(graph), [graph]);
  const story = useMemo(() => buildStory(graph), [graph]);
  const frames = story.frames;
  const frame = cinemaOn ? (frames[step] ?? null) : null;
  const lastStep = frames.length - 1;

  const entityDetail = useMemo(
    () => (selectedNodeId ? toEntityDetail(graph, selectedNodeId) : null),
    [graph, selectedNodeId],
  );

  // 열람한 엔티티를 최근 목록(localStorage)에 기록.
  useEffect(() => {
    if (entityDetail) {
      addRecentNode({
        id: entityDetail.id,
        label: entityDetail.label,
        classKey: entityDetail.classKey,
        classLabel: entityDetail.classLabel,
      });
    }
  }, [entityDetail]);

  const focusNodeIds = frame
    ? [...frame.focusNodes]
    : selectedNodeId
      ? [selectedNodeId]
      : [];

  const exitCinema = useCallback(() => {
    setCinemaOn(false);
    setPlaying(false);
    setStep(0);
  }, []);
  const nextStep = useCallback(
    () => setStep((s) => Math.min(lastStep, s + 1)),
    [lastStep],
  );
  const prevStep = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  useEffect(() => {
    if (!cinemaOn || !playing) return;
    const t = setTimeout(() => {
      if (step >= lastStep) exitCinema();
      else setStep((s) => s + 1);
    }, STEP_MS / speed);
    return () => clearTimeout(t);
  }, [cinemaOn, playing, step, lastStep, speed, exitCinema]);

  useEffect(() => {
    if (!cinemaOn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitCinema();
      else if (e.key === "ArrowRight") nextStep();
      else if (e.key === "ArrowLeft") prevStep();
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cinemaOn, exitCinema, nextStep, prevStep]);

  function startCinema() {
    setStep(0);
    setPlaying(true);
    setCinemaOn(true);
    router.push(pathname);
  }
  function handleNodeClick(id: string) {
    if (cinemaOn) exitCinema();
    router.push(`${pathname}?entityId=${id}`);
  }
  function closePanel() {
    router.push(pathname);
  }
  function handleBackgroundClick() {
    if (selectedNodeId) closePanel();
  }

  const hideChrome = cinemaOn || !!selectedNodeId;

  return (
    <div className="relative h-[78vh] min-h-[560px] w-full overflow-hidden rounded-xl border border-guud-hairline bg-[#02040d]">
      <GalaxyCanvas
        ref={canvasHandle}
        nodes={galaxy.nodes}
        edges={galaxy.edges}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        focusNodeIds={focusNodeIds}
        autoRotate={!cinemaOn && !selectedNodeId}
      />

      <div
        className={cn(
          "transition-opacity duration-500",
          hideChrome ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <EcosystemHUD stats={stats} />
      </div>

      <GalaxySearch onSelect={handleNodeClick} entities={entities} />

      <div
        className={cn(
          "absolute bottom-20 left-4 z-30 transition-opacity duration-500 md:bottom-6 md:left-6",
          hideChrome ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <GalaxyLegend classes={schema.classes} />
      </div>

      {/* 줌 컨트롤 */}
      <div
        className={cn(
          "absolute bottom-6 right-4 z-30 flex flex-col gap-1.5 transition-opacity md:right-6",
          selectedNodeId ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <Button
          variant="outline"
          size="icon"
          aria-label="확대"
          className="h-9 w-9 rounded-lg border-white/10 bg-card/60 backdrop-blur-xl"
          onClick={() => canvasHandle.current?.zoomIn()}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="축소"
          className="h-9 w-9 rounded-lg border-white/10 bg-card/60 backdrop-blur-xl"
          onClick={() => canvasHandle.current?.zoomOut()}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="전체 보기"
          className="h-9 w-9 rounded-lg border-white/10 bg-card/60 backdrop-blur-xl"
          onClick={() => canvasHandle.current?.resetView()}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* 시네마 재생 바 */}
      <div
        className={cn(
          "absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-card/60 px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-all",
          selectedNodeId
            ? "pointer-events-none translate-y-24 opacity-0"
            : "translate-y-0 opacity-100",
        )}
      >
        {!cinemaOn ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={startCinema}
          >
            <Play className="h-4 w-4" />
            시네마 모드 재생
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label="시네마 모드 종료 (ESC)"
              className="h-8 w-8 rounded-full"
              onClick={exitCinema}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="이전 단계"
              className="h-8 w-8 rounded-full"
              disabled={step === 0}
              onClick={prevStep}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              aria-label={playing ? "일시정지" : "재생"}
              className="h-9 w-9 rounded-full"
              onClick={() => {
                if (step >= lastStep && !playing) {
                  setStep(0);
                  setPlaying(true);
                } else setPlaying((p) => !p);
              }}
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="다음 단계"
              className="h-8 w-8 rounded-full"
              disabled={step >= lastStep}
              onClick={nextStep}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <fieldset
              className="m-0 inline-flex overflow-hidden rounded-full border border-white/15 p-0"
              aria-label="재생 속도"
            >
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  aria-pressed={speed === sp}
                  onClick={() => setSpeed(sp)}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                    speed === sp
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {sp}×
                </button>
              ))}
            </fieldset>
            <div className="flex items-center gap-1 pl-1">
              {frames.map((f, i) => (
                <button
                  key={f.title}
                  type="button"
                  onClick={() => {
                    setStep(i);
                    setPlaying(false);
                  }}
                  aria-label={`${i + 1}단계로 이동`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === step
                      ? "w-5 bg-primary"
                      : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground",
                  )}
                />
              ))}
            </div>
            <span className="min-w-[2.5rem] text-center font-mono text-xs text-muted-foreground">
              {step + 1}/{frames.length}
            </span>
          </>
        )}
      </div>

      {frame && (
        <div className="pointer-events-none absolute left-1/2 top-6 z-30 w-full max-w-2xl -translate-x-1/2 px-4 text-center">
          <div className="inline-block rounded-2xl border border-primary/30 bg-card/80 p-5 shadow-2xl backdrop-blur-md md:p-6">
            <h2 className="mb-2 text-lg font-bold text-foreground md:text-xl">
              {step + 1}/{frames.length} · {frame.title}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {frame.caption}
            </p>
          </div>
        </div>
      )}

      {/* 안내 힌트 */}
      {!hideChrome && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-card/50 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-xl">
            <Orbit className="size-3.5" aria-hidden />
            분야=항성 · 회원·조직·산출물이 공전 · 천체 클릭 시 상세 · "/" 검색
          </span>
        </div>
      )}

      {selectedNodeId && entityDetail && (
        <EntityDetailPanel
          entity={entityDetail}
          onClose={closePanel}
          onNavigate={handleNodeClick}
        />
      )}
    </div>
  );
}
