import { describe, expect, it } from "vitest";
import type { OnboardingFinalizeInput, SafeMatchReceipt } from "@/types";
import { applySafeTextConfirmations, buildOnboardingResult } from "./result";

const INPUT: OnboardingFinalizeInput = {
  organization: { name: "연결기업", type: "일반기업", role: "대표" },
  region: { sido: "서울", sigungu: "성동구" },
  field_tags: [1],
  value_chain_stage: "씨앗",
  mission_statement: "지역의 연결을 만듭니다.",
  demand_tags: [
    {
      tagId: 1,
      priority: true,
      detail_quote: "협업 파트너가 필요합니다.",
      safe_match: { approved: true, text: "협업 파트너를 찾고 있습니다." },
    },
  ],
  supply_tags: [{ tagId: 2, detail: "기획 경험을 나눕니다." }],
  activities: ["네트워킹"],
  availability: "월 1회",
  preferred_mode: "온라인 선호",
  participation_scope: "개인 자격으로 참여",
  hot_lead: null,
  readiness: "바로 시작 가능해요",
  trust_connections: [],
  consents: {
    publish_profile: true,
    use_private_needs_for_matching: true,
    quote_in_intro: false,
  },
  visibility_consent: true,
};

describe("온보딩 매칭 결과 변환", () => {
  it("원문·수요·공급·동의를 보존하고 안전 문구는 승인 전 draft로 둔다", () => {
    const result = buildOnboardingResult(
      "M-NEW",
      INPUT,
      "2026-07-29T10:00:00.000Z",
    );
    expect(result.snapshot).toBe(INPUT);
    expect(result.needs[0]).toMatchObject({
      owner: { kind: "person", id: "M-NEW" },
      detail_quote: "협업 파트너가 필요합니다.",
      safe_match_text: "협업 파트너를 찾고 있습니다.",
      safe_match_status: "draft",
    });
    expect(result.offers[0]).toMatchObject({
      owner: { kind: "person", id: "M-NEW" },
      detail: "기획 경험을 나눕니다.",
    });
    expect(result.consents.matching).toBe(true);
  });

  it("서버가 발급한 영수증이 있을 때만 안전 문구를 user_confirmed로 올린다", () => {
    const result = buildOnboardingResult("M-NEW", INPUT);
    const receipt = {
      confirmed_at: "2026-07-29T10:00:00.000Z",
      confirmer_person_id: "M-NEW",
      source_revision: 2,
      content_hash: "a".repeat(64),
      consent_receipt_id: "consent-1",
    } satisfies SafeMatchReceipt;
    const upgraded = applySafeTextConfirmations(result, [
      {
        needId: result.needs[0].id,
        text: "검증된 문구",
        receipt,
      },
    ]);
    expect(upgraded.needs[0].safe_match_status).toBe("user_confirmed");
    expect(upgraded.needs[0].safe_match_text).toBe("검증된 문구");
    expect(upgraded.needs[0].safe_match_receipt).toBe(receipt);
  });
});
