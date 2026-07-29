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

  it("핫리드(M-001)는 차이점 그룹에서 퍼즐형이 1순위로 정렬된다", async () => {
    const { different } = await getRecommendations({
      role: "기업가",
      personaId: "M-001",
    });
    expect(different.length).toBeGreaterThan(0);
    expect(
      different[0].is_hot_lead && different[0].match_type === "퍼즐형",
    ).toBe(true);
  });
});

describe("getRecommendations/getRecommendation — 최소노출 마스킹(FR-RC-06 → P1-1 강화)", () => {
  // P1-1(raw quote 번들 0건): 클라이언트 시드는 redacted twin이라 원문 인용 자체가 없다.
  // 당사자·운영자의 원문 열람은 M2 서버 경계(route/RSC) + 동의 C 검증과 함께 복원한다.
  it("당사자가 아닌 뷰어는 min_exposure_note만 본다", async () => {
    // REC-01: from M-003 to M-004. 제3자(M-007)가 조회.
    const rec = await getRecommendation(
      { role: "전문가", personaId: "M-007" },
      "REC-01",
    );
    expect(rec.message.contact_point).toBe(rec.min_exposure_note);
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
