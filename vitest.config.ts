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
  },
});
