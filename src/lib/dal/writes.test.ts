// writes DAL 유닛 — 거절/후기 세션 반영(FR-FB-*), 타인 추천 조작 방지 회귀 방지.
// 근거: TASKS.md T-003 Verification/Acceptance

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import { getRecommendation } from "./recommendations";
import {
  finalizeOnboarding,
  getDeclineReasons,
  submitDecline,
  submitMeetingOutcome,
} from "./writes";

beforeEach(() => {
  useSessionInteractionStore.getState().reset();
});

describe("getDeclineReasons", () => {
  it("5사유 전건을 반환한다(FR-FB-01)", async () => {
    const reasons = await getDeclineReasons();
    expect(reasons).toHaveLength(5);
  });
});

describe("submitDecline", () => {
  it("수신 당사자가 거절하면 status가 declined로 세션 반영된다", async () => {
    // REC-02: from M-004 to M-003
    const vc = { role: "기업가" as const, personaId: "M-003" };
    await submitDecline(vc, "REC-02", "여력없음");
    const rec = await getRecommendation(vc, "REC-02");
    expect(rec.status).toBe("declined");
    expect(rec.decline_reason).toBe("여력없음");
  });

  it("당사자가 아닌 뷰어의 거절 시도는 reject된다", async () => {
    const vc = { role: "전문가" as const, personaId: "M-007" };
    await expect(submitDecline(vc, "REC-02", "여력없음")).rejects.toThrow();
  });
});

describe("submitMeetingOutcome", () => {
  it("만남 후기가 세션에 반영된다(FR-FB-04)", async () => {
    const vc = { role: "기업가" as const, personaId: "M-003" };
    await submitMeetingOutcome(vc, "REC-02", {
      met: true,
      will_meet_again: true,
      note: "좋았어요",
    });
    const rec = await getRecommendation(vc, "REC-02");
    expect(rec.meeting_outcome).toEqual({
      met: true,
      will_meet_again: true,
      note: "좋았어요",
    });
  });
});

describe("finalizeOnboarding — 서버 영속화 경계", () => {
  const baseInput = {
    organization: { name: "테스트 조합", type: "사회적기업", role: "이사" },
    region: { sido: "전북", sigungu: "전주시" },
    field_tags: [1],
    value_chain_stage: "성장",
    mission_statement: "테스트 미션",
    supply_tags: [{ tagId: 10, detail: "데이터 정리 지원" }],
    activities: ["정책연구"],
    availability: "월 1회",
    preferred_mode: "온라인 선호",
    participation_scope: null,
    hot_lead: null,
    readiness: "관심있는 협업이면 환영해요",
    trust_connections: [],
    visibility_consent: true,
    demand_tags: [
      {
        tagId: 4,
        priority: true,
        detail_quote: "데이터 분석 파트너가 필요해요",
      },
    ],
    consents: {
      publish_profile: true,
      use_private_needs_for_matching: true,
      quote_in_intro: false,
    },
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("클라이언트 persona를 신뢰하지 않고 입력 본문만 서버 API에 전달한다", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual(baseInput);
        return new Response(
          JSON.stringify({
            member: { id: "server-user-id", name: "테스트 회원" },
            firstRecommendations: [],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const vc = { role: "기업가" as const, personaId: "M-001" };
    const result = await finalizeOnboarding(vc, baseInput);
    expect(result.member.id).toBe("server-user-id");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/onboarding/finalize",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("서버 저장 오류를 사용자 메시지로 전달한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "저장할 수 없습니다." }), {
            status: 500,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
    const vc = { role: "기업가" as const, personaId: "M-001" };
    await expect(finalizeOnboarding(vc, baseInput)).rejects.toThrow(
      "저장할 수 없습니다.",
    );
  });
});
