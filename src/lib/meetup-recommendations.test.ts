import { describe, expect, it } from "vitest";
import { recommendMeetupHost } from "@/lib/meetup-recommendations";
import type { MaskedMember, MatchScore } from "@/types";

function member(
  id: string,
  role: string,
  activities: string[],
  expertSubtype: MaskedMember["expert_subtype"] = null,
): MaskedMember {
  return {
    id,
    name: id,
    member_type: expertSubtype ? "전문가" : "기업가",
    expert_subtype: expertSubtype,
    org: { name: `${id} 조직`, type: "협동조합", role },
    region: { sido: "서울", sigungu: "중구" },
    field_tags: [2],
    value_chain_stage: "현장 운영",
    mission_statement: "테스트",
    trust_connections: [{ type: "소속모임", ref: "테스트 모임" }],
    hot_lead: false,
    keyword_set: [],
    affiliation_org_id: null,
    target_org_ids: [],
    visibility: {
      public: {
        supply_tags: [],
        activities,
        preferred_mode: "온라인",
        region: { sido: "서울", sigungu: "중구" },
      },
      private: null,
    },
  };
}

function score(
  fromMemberId: string,
  toMemberId: string,
  value: number,
): MatchScore {
  return {
    from_member_id: fromMemberId,
    to_member_id: toMemberId,
    score: value,
    shared_keywords: [],
    complementary_keywords: [],
    axis: "공통점",
  };
}

describe("recommendMeetupHost", () => {
  it("recommends a host from connection and facilitation signals", () => {
    const members = [
      member("M-001", "팀원", []),
      member("M-002", "부연구위원", ["공동연구"], "공공중간지원"),
      member("M-003", "팀원", []),
    ];
    const scores = [
      score("M-001", "M-002", 75),
      score("M-001", "M-003", 75),
      score("M-002", "M-001", 75),
      score("M-002", "M-003", 75),
      score("M-003", "M-001", 75),
      score("M-003", "M-002", 75),
    ];

    const recommendation = recommendMeetupHost(members, scores);

    expect(recommendation?.host.id).toBe("M-002");
    expect(recommendation?.score).toBe(90);
    expect(recommendation?.reason).toContain("공공·중간지원 경험");
    expect(recommendation?.reason).toContain("구성원 평균 연결도 75점");
  });
});
