// vitest 설정 — T-001에서 도입한 순수 로직(마스킹·DAL 분기) 테스트 하네스.
// 근거: TASKS.md T-001 Testing, ARCHITECTURE.md §9 R-03(visibilityMask 회귀 방지)
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // C3: 매칭 transport를 서버 서비스에 직접 연결(HTTP 없음)
    setupFiles: ["src/test/setup.ts"],
    // 시드 목업 동의(seed_mock)를 신뢰하는 demo 모드로 실행 — fail-closed 검증은
    // 개별 테스트에서 env를 비워 확인한다 (Codex 리뷰 P1-2).
    env: { NEXT_PUBLIC_APP_MODE: "demo" },
  },
});
