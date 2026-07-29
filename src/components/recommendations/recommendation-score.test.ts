import { describe, expect, it } from "vitest";
import type { MatchScore, Recommendation } from "@/types";
import { scoreForRecommendation } from "./recommendation-score";

const score: MatchScore = {
  from_member_id: "M-001",
  to_member_id: "M-006",
  score: 88,
  shared_keywords: ["돌봄"],
  complementary_keywords: ["정책"],
  axis: "공통점",
};

const recommendation = {
  from_member_id: "M-006",
  to_member_id: "M-001",
  source: "engine",
} as Recommendation;

describe("scoreForRecommendation", () => {
  it("엔진 추천 DTO의 수신 방향을 원래 평가 pair로 되돌린다", () => {
    expect(
      scoreForRecommendation(recommendation, new Map([["M-001→M-006", score]])),
    ).toBe(score);
  });
});
