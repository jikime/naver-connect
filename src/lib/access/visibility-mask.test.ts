// visibilityMask 유닛 테스트 — NFR-07/FR-GL-03 "비본인/비운영자는 비공개층 미노출"을 회귀 방지.
// 근거: ARCHITECTURE.md §9 R-03, TASKS.md T-001 Verification/Acceptance

import { describe, expect, it } from "vitest";
import type { Member, ViewerContext } from "@/types";
import {
  isPrivilegedViewer,
  minExposureContactPoint,
  visibilityMask,
} from "./visibility-mask";

const fixtureMember: Member = {
  id: "M-TEST",
  name: "테스트회원",
  member_type: "기업가",
  expert_subtype: null,
  org: { name: "테스트 조직", type: "사회적협동조합", role: "대표" },
  region: { sido: "서울", sigungu: "은평구" },
  field_tags: [2],
  value_chain_stage: "돌봄 서비스제공",
  mission_statement: "테스트 미션",
  trust_connections: [],
  hot_lead: false,
  visibility: {
    public: {
      supply_tags: [{ tagId: 11, detail: "공개 상세" }],
      activities: ["학습모임"],
      preferred_mode: "온라인",
      region: { sido: "서울", sigungu: "은평구" },
    },
    private: {
      demand_tags: [
        { tagId: 6, priority: true, detail_quote: "비공개 원문 인용" },
      ],
      hot_lead: null,
      availability: "월 1회",
      recommendation_history: ["REC-01"],
    },
  },
};

describe("visibilityMask", () => {
  it("비본인·비운영자 뷰어는 visibility.private가 null이다", () => {
    const viewer: ViewerContext = { role: "기업가", personaId: "M-OTHER" };
    const masked = visibilityMask(fixtureMember, viewer);
    expect(masked.visibility.private).toBeNull();
    expect(masked.visibility.public).toEqual(fixtureMember.visibility.public);
  });

  it("본인 뷰어는 visibility.private가 유지된다", () => {
    const viewer: ViewerContext = { role: "기업가", personaId: "M-TEST" };
    const masked = visibilityMask(fixtureMember, viewer);
    expect(masked.visibility.private).toEqual(fixtureMember.visibility.private);
  });

  it("운영자 뷰어는 대상이 본인이 아니어도 visibility.private가 유지된다", () => {
    const viewer: ViewerContext = { role: "운영자", personaId: "M-OTHER" };
    const masked = visibilityMask(fixtureMember, viewer);
    expect(masked.visibility.private).toEqual(fixtureMember.visibility.private);
  });
});

describe("isPrivilegedViewer", () => {
  it("본인·운영자만 true, 그 외는 false", () => {
    expect(
      isPrivilegedViewer({ role: "기업가", personaId: "M-TEST" }, "M-TEST"),
    ).toBe(true);
    expect(
      isPrivilegedViewer({ role: "운영자", personaId: "M-OPS" }, "M-TEST"),
    ).toBe(true);
    expect(
      isPrivilegedViewer({ role: "전문가", personaId: "M-OTHER" }, "M-TEST"),
    ).toBe(false);
  });
});

describe("minExposureContactPoint", () => {
  it("비본인·비운영자 뷰어는 min_exposure_note만 노출된다(FR-RC-06)", () => {
    const viewer: ViewerContext = { role: "기업가", personaId: "M-OTHER" };
    const result = minExposureContactPoint(
      "원문 그대로의 접점 인용",
      "판로를 찾고 계신 A님",
      viewer,
      "M-SOURCE",
    );
    expect(result).toBe("판로를 찾고 계신 A님");
  });

  it("본인/운영자 뷰어는 원문 접점을 그대로 본다", () => {
    const viewer: ViewerContext = { role: "운영자", personaId: "M-OPS" };
    const result = minExposureContactPoint(
      "원문 그대로의 접점 인용",
      "판로를 찾고 계신 A님",
      viewer,
      "M-SOURCE",
    );
    expect(result).toBe("원문 그대로의 접점 인용");
  });
});
