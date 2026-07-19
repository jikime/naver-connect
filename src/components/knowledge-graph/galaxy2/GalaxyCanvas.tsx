"use client";

// GalaxyCanvas — connect-ontology의 Canvas 2D 은하 시각화 엔진 이식(#36).
// 원본: connect-ontology-galaxy/artifacts/connect-ontology/src/components/galaxy-canvas.tsx.
// 상호작용 불변식(.agents/memory/galaxy-canvas-interaction.md): scene effect는 [nodes,edges]만
// 의존, hover/focus/콜백은 ref로 읽는다. 레이아웃은 id 시드 PRNG로 결정적.

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { getEntityColor, getEntityLayer } from "./colors";
import type {
  GalaxyGraphEdge as GraphEdge,
  GalaxyGraphNode as GraphNode,
} from "./types";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 6;
const LABEL_FONT = `"Plus Jakarta Sans", "Noto Sans KR", sans-serif`;

/**
 * 가치사슬 성계(星系) 레이아웃.
 *
 * 분야는 항성(태양)이고, 그 분야에 속한 노드는 층위별 궤도 레인을 돈다:
 *   안쪽 벨트(원천: 회원·조직) → 관계 산출물 → 기회 산출물 → 바깥 궤도(사업 산출물).
 * "바깥 궤도일수록 여문 성과"라는 가치사슬 방향을 공간 구조로 표현한다.
 * 분야가 없는 노드는 은하 중심핵 주위를 돈다.
 */
const LANES: Record<number, { base: number; spread: number; speed: number }> = {
  1: { base: 20, spread: 11, speed: 0.0016 }, // 원천 벨트 (소성군)
  2: { base: 44, spread: 7, speed: 0.0012 }, // 관계 산출물
  3: { base: 60, spread: 7, speed: 0.0009 }, // 기회 산출물
  4: { base: 78, spread: 8, speed: 0.0006 }, // 사업 산출물 (행성)
  0: { base: 94, spread: 7, speed: 0.0004 }, // 기반 (태그·자원)
};
const RING_LANES = [44, 60, 78];
/** 그리기 순서: 작은 천체 먼저, 큰 천체가 위에 오도록. */
const DRAW_ORDER: Record<number, number> = { 1: 0, 0: 1, 2: 2, 3: 3, 4: 4 };
const NEBULA_PALETTE = ["#312e81", "#4c1d95", "#134e4a", "#1e3a8a", "#701a75"];

interface Point {
  x: number;
  y: number;
}

interface BgStar extends Point {
  r: number;
  alpha: number;
  phase: number;
}

interface Nebula extends Point {
  r: number;
  color: string;
}

interface OrbitRing extends Point {
  r: number;
}

interface Particle extends Point {
  id: string;
  radius: number;
  color: string;
  angle: number;
  speed: number;
  orbitRadius: number;
  centerX: number;
  centerY: number;
  /** 가치사슬 층위 (0 기반, 1 원천, 2 관계, 3 기회, 4 사업) — 렌더 스타일을 결정. */
  layer: number;
  /** 반짝임/맥동 위상 (id 기반 고정). */
  phase: number;
  node: GraphNode;
}

interface Planet extends Point {
  id: string;
  radius: number;
  color: string;
  phase: number;
  node: GraphNode;
}

interface Layout {
  planets: Planet[];
  particles: Particle[];
  /** Live positions; planet/particle objects are stored directly so orbit updates are reflected. */
  positions: Map<string, Planet | Particle>;
  cx: number;
  cy: number;
  maxRadius: number;
  nearStars: BgStar[];
  midStars: BgStar[];
  farStars: BgStar[];
  nebulae: Nebula[];
  rings: OrbitRing[];
}

export interface GalaxyCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

interface GalaxyCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (nodeId: string) => void;
  /** Fired when the user clicks/taps empty space (used to dismiss panels). */
  onBackgroundClick?: () => void;
  focusNodeIds?: string[];
  autoRotate?: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Deterministic PRNG seeded per node id so the layout is stable across re-renders and refetches. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export const GalaxyCanvas = forwardRef<GalaxyCanvasHandle, GalaxyCanvasProps>(
  function GalaxyCanvas(
    {
      nodes,
      edges,
      onNodeClick,
      onBackgroundClick,
      focusNodeIds = [],
      autoRotate = true,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const layoutRef = useRef<Layout | null>(null);
    const sizeRef = useRef({ width: 0, height: 0 });
    const cameraRef = useRef({
      x: 0,
      y: 0,
      zoom: 1,
      tx: 0,
      ty: 0,
      tzoom: 1,
      manual: false,
    });
    const hoverRef = useRef<string | null>(null);

    // Interaction callbacks / view options are read through refs by the rAF loop
    // so pointer moves and focus changes never rebuild the scene.
    const focusRef = useRef<string[]>(focusNodeIds);
    const autoRotateRef = useRef(autoRotate);
    const onNodeClickRef = useRef(onNodeClick);
    const onBackgroundClickRef = useRef(onBackgroundClick);
    focusRef.current = focusNodeIds;
    autoRotateRef.current = autoRotate;
    onNodeClickRef.current = onNodeClick;
    onBackgroundClickRef.current = onBackgroundClick;

    // When the focus target changes (node selected, cinema step advance), hand the
    // camera back to auto mode so it flies to the new target.
    const focusKey = focusNodeIds.join(",");
    // biome-ignore lint/correctness/useExhaustiveDependencies: focusKey는 의도된 트리거 — 포커스 집합이 바뀔 때 카메라를 auto 프레이밍으로 되돌린다(galaxy-canvas-interaction 불변식). 제거 금지.
    useEffect(() => {
      cameraRef.current.manual = false;
    }, [focusKey]);

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => {
          const camera = cameraRef.current;
          camera.manual = true;
          camera.tzoom = clamp(camera.tzoom * 1.4, MIN_ZOOM, MAX_ZOOM);
        },
        zoomOut: () => {
          const camera = cameraRef.current;
          camera.manual = true;
          camera.tzoom = clamp(camera.tzoom / 1.4, MIN_ZOOM, MAX_ZOOM);
        },
        resetView: () => {
          const camera = cameraRef.current;
          const layout = layoutRef.current;
          const { width, height } = sizeRef.current;
          if (!layout || !width || !height) return;
          camera.manual = true;
          camera.tx = -layout.cx;
          camera.ty = -layout.cy;
          camera.tzoom = clamp(
            Math.min(width, height) / (layout.maxRadius * 2.85),
            MIN_ZOOM,
            MAX_ZOOM,
          );
        },
      }),
      [],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let width = canvas.clientWidth;
      let height = canvas.clientHeight;

      const applySize = () => {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        sizeRef.current = { width, height };
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      applySize();

      const resizeObserver = new ResizeObserver(() => applySize());
      resizeObserver.observe(canvas);

      // ---------- Layout (rebuilt only when graph data changes) ----------
      const planets: Planet[] = [];
      const particles: Particle[] = [];
      const planetMap = new Map<number, Planet>();
      const positions = new Map<string, Planet | Particle>();
      const systemDir = new Map<string, number>();

      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.max(150, Math.min(width, height) * 0.4);

      // id 순 정렬: API 응답 순서가 바뀌어도 배치가 변하지 않도록 (order-independent).
      const fieldNodes = nodes
        .filter((n) => n.classKey === "field")
        .sort((a, b) => a.id.localeCompare(b.id));
      const otherNodes = nodes
        .filter((n) => n.classKey !== "field")
        .sort((a, b) => a.id.localeCompare(b.id));

      // 항성(분야): 황금각 나선 배치 — 자연스러운 은하 팔 모양 + 시스템 간 간격 확보.
      fieldNodes.forEach((node, i) => {
        const rand = mulberry32(hashString(node.id));
        const angle = i * 2.399963 + (rand() - 0.5) * 0.5;
        const dist =
          maxRadius *
          (0.3 + 0.62 * Math.sqrt((i + 0.6) / Math.max(1, fieldNodes.length))) *
          (0.92 + rand() * 0.16);
        const planet: Planet = {
          id: node.id,
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          radius: 11 + Math.log1p(node.degree || 1) * 2.6,
          color: getEntityColor(node.classKey),
          phase: rand() * Math.PI * 2,
          node,
        };
        planets.push(planet);
        if (node.fieldId != null) {
          planetMap.set(node.fieldId, planet);
          // 같은 항성계의 천체는 같은 방향으로 공전한다.
          systemDir.set(node.id, hashString(node.id) & 1 ? 1 : -1);
        }
        positions.set(node.id, planet);
      });

      otherNodes.forEach((node) => {
        const rand = mulberry32(hashString(node.id));
        const layer = getEntityLayer(node.classKey);
        const lane = LANES[layer] ?? LANES[0];
        const degree = Math.log1p(node.degree || 1);

        let px = cx;
        let py = cy;
        let orbitRadius: number;
        let speed: number;
        let radius: number;

        const sun =
          node.fieldId != null ? planetMap.get(node.fieldId) : undefined;
        if (sun) {
          px = sun.x;
          py = sun.y;
          // 작은 화면(모바일)에서는 궤도를 좁혀 항성계 간 겹침을 줄인다.
          const laneScale = clamp(maxRadius / 288, 0.72, 1);
          orbitRadius =
            sun.radius +
            (lane.base + (rand() - 0.5) * 2 * lane.spread) * laneScale;
          const dir = systemDir.get(sun.id) ?? 1;
          speed = lane.speed * (0.75 + rand() * 0.5) * dir;
        } else {
          // 분야 없는 노드(교류태그·자원 등)는 은하 중심핵의 성단이 된다.
          orbitRadius = maxRadius * (0.08 + rand() * 0.16);
          speed = 0.0005 * (0.6 + rand() * 0.8) * (rand() > 0.5 ? 1 : -1);
        }

        switch (layer) {
          case 1:
            radius = 1.5 + degree * 0.9;
            break; // 원천: 잔별
          case 2:
            radius = 3 + degree * 1.1;
            break;
          case 3:
            radius = 3.4 + degree * 1.2;
            break;
          case 4:
            radius = 5.5 + degree * 1.6;
            break; // 사업: 행성
          default:
            radius = 2 + degree * 0.8;
        }

        const angle = rand() * Math.PI * 2;
        const particle: Particle = {
          id: node.id,
          x: px + Math.cos(angle) * orbitRadius,
          y: py + Math.sin(angle) * orbitRadius,
          radius,
          color: getEntityColor(node.classKey),
          angle,
          speed,
          orbitRadius,
          centerX: px,
          centerY: py,
          layer,
          phase: rand() * Math.PI * 2,
          node,
        };
        particles.push(particle);
        positions.set(node.id, particle);
      });

      particles.sort(
        (a, b) => (DRAW_ORDER[a.layer] ?? 0) - (DRAW_ORDER[b.layer] ?? 0),
      );

      // 궤도 링: 항성마다 관계/기회/사업 레인을 은은하게 표시.
      const rings: OrbitRing[] = [];
      for (const p of planets) {
        for (const base of RING_LANES)
          rings.push({
            x: p.x,
            y: p.y,
            r: p.radius + base * clamp(maxRadius / 288, 0.72, 1),
          });
      }

      // 엣지 곡률 방향은 프레임마다 해시하지 않고 미리 계산해 둔다.
      const edgeMeta = edges
        .filter((e) => e.sourceId !== e.targetId)
        .map((e) => ({
          edge: e,
          bowDir: hashString(`${e.sourceId}>${e.targetId}`) & 1 ? 1 : -1,
        }));

      // 성운: 항성 주변의 저채도 컬러 안개 (범례 색과 혼동되지 않는 별도 팔레트).
      const nebulae: Nebula[] = [];
      planets.forEach((p, i) => {
        const rand = mulberry32(hashString(`nebula:${p.id}`));
        const count = 2;
        for (let k = 0; k < count; k++) {
          const a = rand() * Math.PI * 2;
          const d = 30 + rand() * 80;
          nebulae.push({
            x: p.x + Math.cos(a) * d,
            y: p.y + Math.sin(a) * d,
            r: 90 + rand() * 90,
            color: NEBULA_PALETTE[(i + k) % NEBULA_PALETTE.length],
          });
        }
      });

      // 배경 별밭 3겹 (시드 고정 → 데이터가 같으면 항상 같은 하늘).
      const makeStars = (
        seedKey: string,
        count: number,
        world: boolean,
      ): BgStar[] => {
        const rand = mulberry32(hashString(seedKey));
        const stars: BgStar[] = [];
        for (let i = 0; i < count; i++) {
          stars.push(
            world
              ? {
                  x: cx + (rand() - 0.5) * maxRadius * 3.6,
                  y: cy + (rand() - 0.5) * maxRadius * 3,
                  r: 0.5 + rand() * 1.0,
                  alpha: 0.25 + rand() * 0.5,
                  phase: rand() * Math.PI * 2,
                }
              : {
                  x: rand() * Math.max(1, width),
                  y: rand() * Math.max(1, height),
                  r: 0.4 + rand() * 0.9,
                  alpha: 0.2 + rand() * 0.5,
                  phase: rand() * Math.PI * 2,
                },
          );
        }
        return stars;
      };
      const farStars = makeStars("bg:far", 130, false);
      const midStars = makeStars("bg:mid", 80, false);
      const nearStars = makeStars("bg:near", 130, true);

      layoutRef.current = {
        planets,
        particles,
        positions,
        cx,
        cy,
        maxRadius,
        nearStars,
        midStars,
        farStars,
        nebulae,
        rings,
      };

      const camera = cameraRef.current;
      camera.manual = false;

      // ---------- Interaction ----------
      const toWorld = (sx: number, sy: number): Point => ({
        x: (sx - width / 2) / camera.zoom - camera.x,
        y: (sy - height / 2) / camera.zoom - camera.y,
      });

      const hitTest = (sx: number, sy: number): string | null => {
        const { x: wx, y: wy } = toWorld(sx, sy);
        const slack = 6 / camera.zoom;
        for (const p of planets) {
          const dx = p.x - wx;
          const dy = p.y - wy;
          if (dx * dx + dy * dy < (p.radius + slack) ** 2) return p.id;
        }
        // 큰 천체가 위에 그려지므로 히트테스트는 역순(위→아래)으로.
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          const dx = p.x - wx;
          const dy = p.y - wy;
          if (dx * dx + dy * dy < (p.radius + slack) ** 2) return p.id;
        }
        return null;
      };

      const localPoint = (e: PointerEvent | WheelEvent): Point => {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      };

      const pointers = new Map<number, Point>();
      let dragState: {
        startX: number;
        startY: number;
        lastX: number;
        lastY: number;
        moved: boolean;
      } | null = null;
      let pinchStartDist = 0;
      let pinchStartZoom = 1;

      const zoomAround = (sx: number, sy: number, newZoom: number) => {
        const z = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
        const wx = (sx - width / 2) / camera.zoom - camera.x;
        const wy = (sy - height / 2) / camera.zoom - camera.y;
        camera.zoom = camera.tzoom = z;
        camera.x = camera.tx = (sx - width / 2) / z - wx;
        camera.y = camera.ty = (sy - height / 2) / z - wy;
        camera.manual = true;
      };

      const onPointerDown = (e: PointerEvent) => {
        canvas.setPointerCapture(e.pointerId);
        const { x: sx, y: sy } = localPoint(e);
        pointers.set(e.pointerId, { x: sx, y: sy });
        if (pointers.size === 1) {
          dragState = {
            startX: sx,
            startY: sy,
            lastX: sx,
            lastY: sy,
            moved: false,
          };
        } else if (pointers.size === 2) {
          dragState = null;
          const [a, b] = [...pointers.values()];
          pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y);
          pinchStartZoom = camera.zoom;
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        const { x: sx, y: sy } = localPoint(e);
        if (pointers.has(e.pointerId))
          pointers.set(e.pointerId, { x: sx, y: sy });

        if (pointers.size === 2 && pinchStartDist > 0) {
          const [a, b] = [...pointers.values()];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          zoomAround(midX, midY, pinchStartZoom * (dist / pinchStartDist));
          return;
        }

        if (dragState && pointers.size === 1) {
          if (
            !dragState.moved &&
            Math.hypot(sx - dragState.startX, sy - dragState.startY) > 5
          ) {
            dragState.moved = true;
            canvas.style.cursor = "grabbing";
          }
          if (dragState.moved) {
            camera.x = camera.tx =
              camera.x + (sx - dragState.lastX) / camera.zoom;
            camera.y = camera.ty =
              camera.y + (sy - dragState.lastY) / camera.zoom;
            camera.manual = true;
          }
          dragState.lastX = sx;
          dragState.lastY = sy;
          return;
        }

        if (e.pointerType === "mouse") {
          const found = hitTest(sx, sy);
          if (found !== hoverRef.current) {
            hoverRef.current = found;
            canvas.style.cursor = found ? "pointer" : "default";
          }
        }
      };

      const onPointerEnd = (e: PointerEvent) => {
        const { x: sx, y: sy } = localPoint(e);
        const wasTap =
          dragState !== null && !dragState.moved && e.type === "pointerup";
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinchStartDist = 0;
        if (pointers.size === 0) dragState = null;

        if (wasTap) {
          const found = hitTest(sx, sy);
          if (found) onNodeClickRef.current(found);
          else onBackgroundClickRef.current?.();
        }
        canvas.style.cursor = hoverRef.current ? "pointer" : "default";
      };

      const onPointerLeave = (e: PointerEvent) => {
        if (e.pointerType === "mouse" && pointers.size === 0) {
          hoverRef.current = null;
          canvas.style.cursor = "default";
        }
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const { x: sx, y: sy } = localPoint(e);
        zoomAround(sx, sy, camera.zoom * Math.exp(-e.deltaY * 0.0015));
      };

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerEnd);
      canvas.addEventListener("pointercancel", onPointerEnd);
      canvas.addEventListener("pointerleave", onPointerLeave);
      canvas.addEventListener("wheel", onWheel, { passive: false });

      // ---------- Render loop ----------
      let raf = 0;

      const drawScreenStars = (
        stars: BgStar[],
        parallax: number,
        t: number,
      ) => {
        for (const s of stars) {
          const x =
            (((s.x + camera.x * camera.zoom * parallax) % width) + width) %
            width;
          const y =
            (((s.y + camera.y * camera.zoom * parallax) % height) + height) %
            height;
          ctx.globalAlpha =
            s.alpha * (0.7 + 0.3 * Math.sin(t * 0.0008 + s.phase));
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = "#cbd5e1";
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      const render = () => {
        // During orientation changes / layout transitions the canvas can be
        // measured at 0x0 for a frame; skip rendering so the camera never
        // divides by zero (NaN/Infinity zoom) and resumes cleanly.
        if (!width || !height) {
          raf = requestAnimationFrame(render);
          return;
        }
        const t = performance.now();
        const focusIds = focusRef.current;
        const hovered = hoverRef.current;

        // ---- 심우주 배경 (스크린 좌표) ----
        const vignette = ctx.createRadialGradient(
          width * 0.5,
          height * 0.42,
          0,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.75,
        );
        vignette.addColorStop(0, "#0b1224");
        vignette.addColorStop(0.55, "#050a18");
        vignette.addColorStop(1, "#02040d");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        drawScreenStars(farStars, 0.05, t);
        drawScreenStars(midStars, 0.12, t);

        if (!camera.manual) {
          if (focusIds.length > 0) {
            let ax = 0;
            let ay = 0;
            let count = 0;
            for (const id of focusIds) {
              const pos = positions.get(id);
              if (pos) {
                ax += pos.x;
                ay += pos.y;
                count++;
              }
            }
            if (count > 0) {
              camera.tx = -(ax / count);
              camera.ty = -(ay / count);
              camera.tzoom = 1.6;
            }
          } else {
            camera.tx = -cx;
            camera.ty = -cy;
            camera.tzoom = clamp(
              Math.min(width, height) / (maxRadius * 2.85),
              MIN_ZOOM,
              MAX_ZOOM,
            );
          }
        }
        camera.x += (camera.tx - camera.x) * 0.07;
        camera.y += (camera.ty - camera.y) * 0.07;
        camera.zoom += (camera.tzoom - camera.zoom) * 0.07;

        const zoom = camera.zoom;
        const px = (v: number) => v / zoom; // screen-constant size helper

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(camera.x, camera.y);

        // ---- 성운 & 은하 중심핵 ----
        for (const nb of nebulae) {
          const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r);
          g.addColorStop(0, hexToRgba(nb.color, 0.14));
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(nb.x, nb.y, nb.r, 0, Math.PI * 2);
          ctx.fill();
        }
        {
          const core = ctx.createRadialGradient(
            cx,
            cy,
            0,
            cx,
            cy,
            maxRadius * 0.45,
          );
          core.addColorStop(0, "rgba(191,219,254,0.16)");
          core.addColorStop(0.35, "rgba(147,197,253,0.07)");
          core.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = core;
          ctx.beginPath();
          ctx.arc(cx, cy, maxRadius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        // ---- 근경 별밭 (월드 좌표 → 자연 시차) ----
        for (const s of nearStars) {
          ctx.globalAlpha =
            s.alpha * (0.7 + 0.3 * Math.sin(t * 0.001 + s.phase));
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = "#e2e8f0";
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ---- 궤도 링 ----
        ctx.strokeStyle = "rgba(148,163,184,0.07)";
        ctx.lineWidth = Math.min(1, px(1));
        for (const ring of rings) {
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (autoRotateRef.current) {
          for (const p of particles) {
            p.angle += p.speed;
            p.x = p.centerX + Math.cos(p.angle) * p.orbitRadius;
            p.y = p.centerY + Math.sin(p.angle) * p.orbitRadius;
          }
        }

        // ---- 엣지 (곡선) ----
        const dash = [px(5), px(5)];
        for (const { edge, bowDir } of edgeMeta) {
          const source = positions.get(edge.sourceId);
          const target = positions.get(edge.targetId);
          if (!source || !target) continue;

          const isActive =
            hovered === edge.sourceId ||
            hovered === edge.targetId ||
            focusIds.includes(edge.sourceId) ||
            focusIds.includes(edge.targetId);

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.hypot(dx, dy) || 1;
          const bow = Math.min(30, dist * 0.12) * bowDir;
          const mx = (source.x + target.x) / 2 - (dy / dist) * bow;
          const my = (source.y + target.y) / 2 + (dx / dist) * bow;

          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.quadraticCurveTo(mx, my, target.x, target.y);
          if (isActive) {
            const g = ctx.createLinearGradient(
              source.x,
              source.y,
              target.x,
              target.y,
            );
            g.addColorStop(0, source.color);
            g.addColorStop(1, target.color);
            ctx.strokeStyle = g;
            ctx.globalAlpha = 0.9;
          } else if (edge.emphasis) {
            ctx.strokeStyle = "rgba(251,191,36,0.32)";
          } else {
            ctx.strokeStyle = "rgba(148,163,184,0.13)";
          }
          ctx.lineWidth = px((edge.emphasis ? 2 : 1) * (isActive ? 2.2 : 1));
          ctx.setLineDash(edge.kind === "potential" ? dash : []);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.setLineDash([]);

        // ---- 천체 (층위별 스타일) ----
        for (const p of particles) {
          const isHovered = hovered === p.id;
          const isFocused = focusIds.includes(p.id);
          const dimmed =
            focusIds.length > 0 && !isFocused && !isHovered ? 0.3 : 1;
          const r = isHovered ? p.radius * 1.5 : p.radius;

          if (p.layer === 1) {
            // 원천: 반짝이는 잔별
            const twinkle =
              0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.002 + p.phase));
            ctx.globalAlpha = dimmed * twinkle;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
          } else if (p.layer === 3) {
            // 기회: 맥동하는 신호등(비컨)
            const pulse = 1 + 0.14 * Math.sin(t * 0.003 + p.phase);
            ctx.globalAlpha = dimmed * 0.18;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 2.4 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.globalAlpha = dimmed;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * pulse, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.layer === 4) {
            // 사업: 음영 있는 행성 (딜룸은 고리 행성)
            ctx.globalAlpha = dimmed;
            const g = ctx.createRadialGradient(
              p.x - r * 0.35,
              p.y - r * 0.35,
              r * 0.15,
              p.x,
              p.y,
              r,
            );
            g.addColorStop(0, "#f8fafc");
            g.addColorStop(0.35, p.color);
            g.addColorStop(1, hexToRgba(p.color, 0.25));
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
            if (p.node.classKey === "deal_room") {
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(-0.45);
              ctx.scale(1, 0.34);
              ctx.beginPath();
              ctx.arc(0, 0, r * 1.75, 0, Math.PI * 2);
              ctx.strokeStyle = hexToRgba(p.color, 0.55);
              ctx.lineWidth = 1.2;
              ctx.stroke();
              ctx.restore();
            }
          } else {
            // 관계(2)·기반(0): 부드러운 광륜
            ctx.globalAlpha = dimmed * (p.layer === 2 ? 0.16 : 0.1);
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 2.1, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.globalAlpha = dimmed;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
          }

          if (isHovered || isFocused) {
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.font = `500 ${px(11)}px ${LABEL_FONT}`;
            ctx.textAlign = "left";
            ctx.lineWidth = px(3);
            ctx.strokeStyle = "rgba(4,8,20,0.85)";
            ctx.strokeText(p.node.label, p.x + r + px(6), p.y + px(4));
            ctx.fillStyle = "#fff";
            ctx.fillText(p.node.label, p.x + r + px(6), p.y + px(4));
          } else if (p.layer === 4 && zoom >= 1.25) {
            // 확대하면 사업 산출물(행성)의 이름이 드러난다.
            ctx.globalAlpha = dimmed * 0.85;
            ctx.font = `500 ${px(10)}px ${LABEL_FONT}`;
            ctx.textAlign = "center";
            ctx.lineWidth = px(2.5);
            ctx.strokeStyle = "rgba(4,8,20,0.8)";
            ctx.strokeText(p.node.label, p.x, p.y - r - px(5));
            ctx.fillStyle = "rgba(241,245,249,0.95)";
            ctx.fillText(p.node.label, p.x, p.y - r - px(5));
          }
          ctx.globalAlpha = 1;
        }

        // ---- 항성 (분야) ----
        for (const p of planets) {
          const isHovered = hovered === p.id;
          const isFocused = focusIds.includes(p.id);
          const opacity =
            focusIds.length > 0 && !isFocused && !isHovered ? 0.4 : 1;
          const r = isHovered ? p.radius * 1.2 : p.radius;
          const breath = 1 + 0.06 * Math.sin(t * 0.0012 + p.phase);

          ctx.globalAlpha = opacity;

          // 코로나
          const corona = ctx.createRadialGradient(
            p.x,
            p.y,
            r * 0.5,
            p.x,
            p.y,
            r * 3 * breath,
          );
          corona.addColorStop(0, hexToRgba(p.color, 0.36));
          corona.addColorStop(0.4, hexToRgba(p.color, 0.12));
          corona.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 3 * breath, 0, Math.PI * 2);
          ctx.fillStyle = corona;
          ctx.fill();

          // 항성 본체
          const body = ctx.createRadialGradient(
            p.x - r * 0.2,
            p.y - r * 0.25,
            r * 0.1,
            p.x,
            p.y,
            r,
          );
          body.addColorStop(0, "#fffbeb");
          body.addColorStop(0.45, "#fde68a");
          body.addColorStop(0.8, p.color);
          body.addColorStop(1, hexToRgba(p.color, 0.6));
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = body;
          ctx.fill();

          ctx.strokeStyle = "rgba(253,230,138,0.5)";
          ctx.lineWidth = px(1.5);
          ctx.stroke();

          ctx.font = `600 ${px(13)}px ${LABEL_FONT}`;
          ctx.textAlign = "center";
          ctx.lineWidth = px(3);
          ctx.strokeStyle = "rgba(4,8,20,0.85)";
          ctx.strokeText(p.node.label, p.x, p.y - r * 3 * breath + px(2));
          ctx.fillStyle = "#fff";
          ctx.fillText(p.node.label, p.x, p.y - r * 3 * breath + px(2));
          ctx.globalAlpha = 1;
        }

        // Focus rings
        if (focusIds.length > 0) {
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = px(1.5);
          for (const id of focusIds) {
            const pos = positions.get(id);
            if (!pos) continue;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pos.radius + px(5), 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        ctx.restore();
        raf = requestAnimationFrame(render);
      };

      render();

      return () => {
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerEnd);
        canvas.removeEventListener("pointercancel", onPointerEnd);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("wheel", onWheel);
      };
    }, [nodes, edges]);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full bg-[#02040d] touch-none select-none"
      />
    );
  },
);
