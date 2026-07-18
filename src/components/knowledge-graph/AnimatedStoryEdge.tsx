"use client";

// AnimatedStoryEdge — 스토리 "만남 성사" 순간 엣지를 따라 흐르는 레드 파티클.
// 근거: team-lead #19(React Flow AnimatedSVGEdge / animateMotion 패턴).
// prefers-reduced-motion이면 파티클을 그리지 않고 굵은 실선만 남긴다(페이드만).

import { BaseEdge, type EdgeProps, getStraightPath } from "@xyflow/react";
import { KG_EMPHASIS_COLOR } from "./graph-meta";

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function AnimatedStoryEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
}: EdgeProps) {
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const reduced = reducedMotion();
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{ stroke: KG_EMPHASIS_COLOR, strokeWidth: 2.6 }}
      />
      {!reduced && (
        <>
          <circle r="4.5" fill={KG_EMPHASIS_COLOR}>
            <animateMotion dur="1.3s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r="4.5" fill={KG_EMPHASIS_COLOR} opacity="0.5">
            <animateMotion
              dur="1.3s"
              begin="0.65s"
              repeatCount="indefinite"
              path={path}
            />
          </circle>
        </>
      )}
    </>
  );
}
