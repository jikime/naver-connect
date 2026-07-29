import { describe, expect, it } from "vitest";
import { onboardingFinalizeSchema } from "./validation";

const validInput = {
  organization: { name: "연결 협동조합", type: "협동조합", role: "대표" },
  region: { sido: "서울", sigungu: "성동구" },
  field_tags: [1, 2],
  value_chain_stage: "성장",
  mission_statement: "지역의 문제를 협업으로 해결합니다.",
  demand_tags: [
    { tagId: 1, priority: true, detail_quote: "운영 파트너가 필요합니다." },
  ],
  supply_tags: [{ tagId: 2, detail: "조직 운영 경험을 나눕니다." }],
  activities: ["학습모임"],
  availability: "월 2~3회",
  preferred_mode: "온라인·오프라인 무관",
  participation_scope: "소속 기관을 대표해 참여",
  hot_lead: null,
  readiness: "관심있는 협업이면 환영해요",
  trust_connections: [],
  consents: {
    publish_profile: true,
    use_private_needs_for_matching: true,
    quote_in_intro: false,
  },
  visibility_consent: true,
};

describe("온보딩 서버 입력 검증", () => {
  it("정상 입력을 허용한다", () => {
    expect(onboardingFinalizeSchema.safeParse(validInput).success).toBe(true);
  });

  it("공개 동의가 서로 다르면 거부한다", () => {
    expect(
      onboardingFinalizeSchema.safeParse({
        ...validInput,
        visibility_consent: false,
      }).success,
    ).toBe(false);
  });

  it("최우선 수요가 둘이면 거부한다", () => {
    expect(
      onboardingFinalizeSchema.safeParse({
        ...validInput,
        demand_tags: [
          ...validInput.demand_tags,
          { tagId: 3, priority: true, detail_quote: "두 번째 최우선" },
        ],
      }).success,
    ).toBe(false);
  });
});
