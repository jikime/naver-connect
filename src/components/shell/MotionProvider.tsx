"use client";

// MotionProvider — 전역 모션 정책 단일 지점(Task #21). reducedMotion="user"로 OS/브라우저의
// prefers-reduced-motion 설정을 앱 전체 motion 컴포넌트에 자동 적용한다(개별 컴포넌트마다
// useReducedMotion을 따로 체크하지 않아도 transform/layout 애니메이션이 일괄 비활성화되고,
// opacity 등은 유지된다 — motion.dev/docs/react-accessibility).
// 근거: TASKS.md 없음(M5 이후 추가 폴리시), motion(구 framer-motion) 패키지.
// layout.tsx는 Server Component라 이 클라이언트 래퍼로 분리한다.

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
