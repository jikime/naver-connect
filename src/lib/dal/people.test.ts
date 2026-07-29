// people DAL 유닛 — Need 민감층 fail-closed 회귀 방지 (본인·운영자 외 빈 배열, BR-01/NFR-07 계열)
// 근거: plans/generic-mixing-seahorse.md M0-4, people_match_retrieval_plan.md §4.1

import { describe, expect, it } from "vitest";
import {
  getCapabilityOffers,
  getConsentRecords,
  getImpactIntents,
  getNeedIntents,
} from "@/lib/dal/people";
import {
  hasActiveConsent,
  listActiveNeedIntentsForEngine,
} from "@/lib/dal/people-engine";

describe("getCapabilityOffers / getImpactIntents — 공개층", () => {
  it("모든 뷰어에게 전건을 반환한다 (마이그레이션: offers 13 · impact 8)", async () => {
    const offers = await getCapabilityOffers({
      role: "기업가",
      personaId: "M-001",
    });
    const impacts = await getImpactIntents({
      role: "전문가",
      personaId: "M-005",
    });
    expect(offers.length).toBe(13);
    expect(impacts.length).toBe(8);
    expect(offers.every((o) => o.detail.length > 0)).toBe(true);
  });
});

describe("getNeedIntents — 민감층 fail-closed", () => {
  it("본인 뷰어에게는 본인 Need만 반환한다", async () => {
    const mine = await getNeedIntents({ role: "기업가", personaId: "M-001" });
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((n) => n.owner.id === "M-001")).toBe(true);
  });

  it("타인 명의 Need는 어떤 비운영자 뷰어에게도 섞이지 않는다", async () => {
    const viewerNeeds = await getNeedIntents({
      role: "전문가",
      personaId: "M-005",
    });
    expect(viewerNeeds.some((n) => n.owner.id !== "M-005")).toBe(false);
  });

  it("운영자는 전건(15)을 본다", async () => {
    const all = await getNeedIntents({ role: "운영자", personaId: "OP-1" });
    expect(all.length).toBe(15);
  });

  it("원문 detail_quote가 보존되고 safe_match_text는 아직 draft다 (BR-02 + 임베딩 입력 금지)", async () => {
    const all = await getNeedIntents({ role: "운영자", personaId: "OP-1" });
    expect(all.every((n) => n.detail_quote.length > 0)).toBe(true);
    expect(all.every((n) => n.safe_match_status === "draft")).toBe(true);
  });
});

describe("consents — 목적별 영수증", () => {
  it("본인 동의 영수증만 조회되고, 시드 동의는 seed_mock으로 명시돼 있다", async () => {
    const mine = await getConsentRecords({
      role: "기업가",
      personaId: "M-001",
    });
    expect(mine.length).toBe(3);
    expect(mine.every((c) => c.source === "seed_mock")).toBe(true);
  });

  it("타인 동의는 비운영자에게 빈 배열이다", async () => {
    const other = await getConsentRecords(
      { role: "기업가", personaId: "M-001" },
      "M-002",
    );
    expect(other).toEqual([]);
  });

  it("hasActiveConsent는 매칭 동의를 인정하고, 없는 목적(model_training)은 거부한다", () => {
    expect(hasActiveConsent("M-001", "use_private_needs_for_matching")).toBe(
      true,
    );
    expect(hasActiveConsent("M-001", "model_training")).toBe(false);
  });
});

describe("listActiveNeedIntentsForEngine — 엔진 전용", () => {
  it("활성 Need 전건을 반환한다 (배럴 미등록 — UI 직접 사용 금지 계약)", () => {
    expect(listActiveNeedIntentsForEngine().length).toBe(15);
  });
});
