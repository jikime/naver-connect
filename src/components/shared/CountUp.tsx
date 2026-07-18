"use client";

// CountUp — 숫자가 바뀔 때 카운트업 애니메이션(Task #21, KPI 대시보드 등). prefers-reduced-motion이면
// 애니메이션 없이 바로 최종값을 표시한다(MotionConfig의 reducedMotion="user"는 motion.* 컴포넌트의
// transform/layout에만 적용되므로, 이 숫자 트윈은 useReducedMotion으로 별도 확인한다).

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function CountUp({
  value,
  decimals = 0,
  durationMs = 800,
}: {
  value: number;
  decimals?: number;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(value);
  const prefersReducedMotion = useReducedMotion();
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value);
      prevValueRef.current = value;
      return;
    }
    const controls = animate(prevValueRef.current, value, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    prevValueRef.current = value;
    return () => controls.stop();
  }, [value, durationMs, prefersReducedMotion]);

  return <>{display.toFixed(decimals)}</>;
}
