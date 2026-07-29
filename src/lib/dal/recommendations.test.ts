// recommendations DAL 유닛 — 공공중간지원 분기(FR-RC-08)·최소노출 마스킹(FR-RC-06) 회귀 방지.
// 근거: TASKS.md T-003 Verification/Acceptance

import { beforeEach, describe, expect, it } from "vitest";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import {
  getRecommendation,
  getRecommendationGraphEdges,
  getRecommendations,
} from "./recommendations";

beforeEach(() => {
  useSessionInteractionStore.getState().reset();
});

describe("getRecommendations — 공공중간지원 분기(FR-RC-08)", () => {
  it("대상이 공공중간지원(M-006)이면 1:1 카드는 0건, 모듬만 반환한다", async () => {
    const { common, different } = await getRecommendations({
      role: "전문가",
      personaId: "M-006",
    });
    const all = [...common, ...different];
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((r) => r.rec_kind === "모듬")).toBe(true);
  });

  it("일반 회원(M-004)은 1:1 추천을 정상적으로 받는다(FR-RC-01)", async () => {
    const { common, different } = await getRecommendations({
      role: "기업가",
      personaId: "M-004",
    });
    expect([...common, ...different].some((r) => r.rec_kind === "1:1")).toBe(
      true,
    );
  });
});

describe("getRecommendations — v1.1 공통점/차이점 그룹핑(FR-RC-01/02)", () => {
  it("rec_axis에 따라 common/different로 나뉘어 반환된다", async () => {
    const { common, different } = await getRecommendations({
      role: "기업가",
      personaId: "M-001",
    });
    expect(common.every((r) => r.rec_axis === "공통점")).toBe(true);
    expect(different.every((r) => r.rec_axis === "차이점")).toBe(true);
  });

  it("client seed는 hot-lead 상태를 중립화한다", async () => {
    const { different } = await getRecommendations({
      role: "기업가",
      personaId: "M-001",
    });
    expect(different.length).toBeGreaterThan(0);
    expect(different.every((rec) => rec.is_hot_lead === false)).toBe(true);
  });

  it("운영자는 온보딩 persona 없이 전체 허용 추천을 확인한다", async () => {
    const { common, different } = await getRecommendations({
      role: "운영자",
      personaId: "OPERATOR",
    });
    const all = [...common, ...different];
    expect(all.length).toBeGreaterThan(0);
    expect(new Set(all.map((rec) => rec.to_member_id)).size).toBeGreaterThan(1);
  });
});

describe("getRecommendations/getRecommendation — 최소노출 마스킹(FR-RC-06 → P1-1 강화)", () => {
  // P1-1(raw quote 번들 0건): 클라이언트 시드는 redacted twin이라 원문 인용 자체가 없다.
  // 당사자·운영자의 원문 열람은 M2 서버 경계(route/RSC) + 동의 C 검증과 함께 복원한다.
  it("당사자가 아닌 뷰어의 ID 직접 조회는 reject된다", async () => {
    // REC-01: from M-003 to M-004. 제3자(M-007)가 ID를 알아도 조회할 수 없다.
    await expect(
      getRecommendation({ role: "전문가", personaId: "M-007" }, "REC-01"),
    ).rejects.toThrow("Recommendation not found");
  });

  it("수신 당사자여도 클라이언트에는 원문이 존재하지 않는다 — 최소노출 문구로 통일", async () => {
    const rec = await getRecommendation(
      { role: "기업가", personaId: "M-004" },
      "REC-01",
    );
    expect(rec.message.contact_point).toBe(rec.min_exposure_note);
  });

  it("운영자도 클라이언트 경로에서는 최소노출 문구만 본다 (원문 열람은 서버 경계 도입 후)", async () => {
    const rec = await getRecommendation(
      { role: "운영자", personaId: "M-999" },
      "REC-01",
    );
    expect(rec.message.contact_point).toBe(rec.min_exposure_note);
  });
});

describe("getRecommendationGraphEdges — 뷰어 범위와 동의 gate", () => {
  it("운영자는 전체 구조 엣지를 보지만 일반 회원은 본인 관련 + 양쪽 동의 pair만 본다", async () => {
    const operatorEdges = await getRecommendationGraphEdges({
      role: "운영자",
      personaId: "M-999",
    });
    const memberEdges = await getRecommendationGraphEdges({
      role: "기업가",
      personaId: "M-001",
    });
    expect(operatorEdges.length).toBeGreaterThan(memberEdges.length);
    expect(
      memberEdges.every((edge) => edge.from === "M-001" || edge.to === "M-001"),
    ).toBe(true);
  });

  it("제3자는 엔진 추천 ID를 직접 구성해도 조회할 수 없다", async () => {
    const owner = { role: "기업가" as const, personaId: "M-001" };
    const { common, different } = await getRecommendations(owner);
    const engine = [...common, ...different].find(
      (rec) => rec.source === "engine",
    );
    expect(engine).toBeDefined();
    await expect(
      getRecommendation(
        { role: "전문가", personaId: "M-007" },
        engine?.id ?? "",
      ),
    ).rejects.toThrow("Recommendation not found");
  });

  it("Next 동적 경로가 percent-encode한 엔진 추천 ID도 상세 조회된다", async () => {
    const owner = { role: "기업가" as const, personaId: "M-001" };
    const { common, different } = await getRecommendations(owner);
    const engine = [...common, ...different].find(
      (rec) => rec.source === "engine",
    );
    expect(engine).toBeDefined();
    const detail = await getRecommendation(
      owner,
      encodeURIComponent(engine?.id ?? ""),
    );
    expect(detail.id).toBe(engine?.id);
  });
});

describe("getRecommendations — declined 주간 목록 재노출 차단(C4 #3)", () => {
  it("시드 원본이 declined인 REC-06은 수신자(M-004) 주간 목록에 등장하지 않는다", async () => {
    const { common, different } = await getRecommendations({
      role: "기업가",
      personaId: "M-004",
    });
    const ids = [...common, ...different].map((r) => r.id);
    expect(ids).not.toContain("REC-06");
  });

  it("세션에서 거절한 추천은 즉시 주간 목록에서 사라진다", async () => {
    const vc = { role: "기업가" as const, personaId: "M-001" };
    const before = await getRecommendations(vc);
    expect([...before.common, ...before.different].map((r) => r.id)).toContain(
      "REC-07",
    );
    useSessionInteractionStore.getState().setRecommendationOverride("REC-07", {
      status: "declined",
      decline_reason: "관심없음",
    });
    const after = await getRecommendations(vc);
    expect(
      [...after.common, ...after.different].map((r) => r.id),
    ).not.toContain("REC-07");
    // 상세(영수증) 조회는 유지된다 — 거절 직후 확인 화면 계약(writes.test와 동일).
    const receipt = await getRecommendation(vc, "REC-07");
    expect(receipt.status).toBe("declined");
  });
});
