// recommendations DAL 유닛 — 공공중간지원 분기(FR-RC-08)·최소노출 마스킹(FR-RC-06) 회귀 방지.
// 근거: TASKS.md T-003 Verification/Acceptance

import { beforeEach, describe, expect, it } from "vitest";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import { getRecommendation, getRecommendations } from "./recommendations";

beforeEach(() => {
  useSessionInteractionStore.getState().reset();
});

describe("getRecommendations — 공공중간지원 분기(FR-RC-08)", () => {
  it("대상이 공공중간지원(M-006)이면 1:1 카드는 0건, 모듬만 반환한다", async () => {
    const recs = await getRecommendations({
      role: "전문가",
      personaId: "M-006",
    });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.rec_kind === "모듬")).toBe(true);
  });

  it("일반 회원(M-004)은 1:1 추천을 정상적으로 받는다(FR-RC-01)", async () => {
    const recs = await getRecommendations({
      role: "기업가",
      personaId: "M-004",
    });
    expect(recs.some((r) => r.rec_kind === "1:1")).toBe(true);
  });
});

describe("getRecommendations/getRecommendation — 최소노출 마스킹(FR-RC-06)", () => {
  it("당사자가 아닌 뷰어는 원문 접점 대신 min_exposure_note만 본다", async () => {
    // REC-01: from M-003 to M-004. 제3자(M-007)가 조회.
    const rec = await getRecommendation(
      { role: "전문가", personaId: "M-007" },
      "REC-01",
    );
    expect(rec.message.contact_point).toBe(rec.min_exposure_note);
  });

  it("수신 당사자(to_member_id)는 원문 접점을 그대로 본다", async () => {
    const rec = await getRecommendation(
      { role: "기업가", personaId: "M-004" },
      "REC-01",
    );
    expect(rec.message.contact_point).not.toBe(rec.min_exposure_note);
  });

  it("운영자는 당사자가 아니어도 원문 접점을 그대로 본다", async () => {
    const rec = await getRecommendation(
      { role: "운영자", personaId: "M-999" },
      "REC-01",
    );
    expect(rec.message.contact_point).not.toBe(rec.min_exposure_note);
  });
});
