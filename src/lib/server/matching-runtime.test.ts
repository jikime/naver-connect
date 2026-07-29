import { describe, expect, it } from "vitest";
import { matchingSessionFromDatabase } from "./matching-runtime";

describe("matchingSessionFromDatabase", () => {
  it("일반 회원이 저장한 가중치는 매칭에 적용하지 않는다", () => {
    const session = matchingSessionFromDatabase(
      {
        ruleWeightOverrides: [{ keyword: "조작값", weight: 99 }],
        recommendationOverrides: { "REC-1": { status: "declined" } },
      },
      {},
      "기업가",
    );
    expect(session.ruleWeightOverrides).toBeNull();
    expect(session.recommendationOverrides["REC-1"]?.status).toBe("declined");
  });

  it("운영자는 DB에 저장된 가중치를 사용할 수 있다", () => {
    const weights = [{ keyword: "돌봄", weight: 1.2 }];
    const session = matchingSessionFromDatabase(
      { ruleWeightOverrides: weights },
      {},
      "운영자",
    );
    expect(session.ruleWeightOverrides).toEqual(weights);
  });
});
