// kpi DAL 유닛 — shown_in_mvp 필터가 2·3단계 KPI를 제외하고 1단계 6종만 반환하는지 회귀 방지.
// 근거: TASKS.md T-004 Verification/Acceptance(M-3)

import { describe, expect, it } from "vitest";
import { getKpis } from "./kpi";

describe("getKpis", () => {
  it("1단계 6종만 반환하고 2·3단계는 제외한다", async () => {
    const kpis = await getKpis({ role: "운영자", personaId: "OPERATOR" });
    expect(kpis).toHaveLength(6);
    expect(kpis.every((kpi) => kpi.stage === 1)).toBe(true);
    expect(kpis.every((kpi) => kpi.shown_in_mvp)).toBe(true);
  });
});
