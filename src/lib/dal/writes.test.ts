// writes DAL 유닛 — 거절/후기 세션 반영(FR-FB-*), 타인 추천 조작 방지 회귀 방지.
// 근거: TASKS.md T-003 Verification/Acceptance

import { beforeEach, describe, expect, it } from "vitest";
import { snapshotSessionState } from "@/lib/dal/matching";
import { runMatchingEngine } from "@/lib/server/matching-service";
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

describe("finalizeOnboarding — safe_match_text 승인 흐름(M2 P1-1)", () => {
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
  };

  it("승인 의사 + 매칭 동의(B)면 서버 영수증으로 user_confirmed 승격되고 엔진 텍스트에 실린다", async () => {
    const vc = { role: "기업가" as const, personaId: "M-001" };
    await finalizeOnboarding(vc, {
      ...baseInput,
      demand_tags: [
        {
          tagId: 4,
          priority: true,
          detail_quote: "데이터 분석 파트너가 필요해요",
          safe_match: {
            approved: true,
            text: "데이터 분석 협업 파트너 찾는 중",
          },
        },
      ],
      consents: {
        publish_profile: true,
        use_private_needs_for_matching: true,
        quote_in_intro: false,
      },
    });
    const stored =
      useSessionInteractionStore.getState().onboardingResults["M-001"];
    const need = stored.needs[0];
    expect(need.safe_match_status).toBe("user_confirmed");
    expect(need.safe_match_text).toBe("데이터 분석 협업 파트너 찾는 중");
    expect(need.safe_match_receipt?.confirmer_person_id).toBe("M-001");
    expect(need.safe_match_receipt?.consent_receipt_id).toContain(
      "consent-session-M-001",
    );
    const { input } = runMatchingEngine(snapshotSessionState());
    expect(input.needs.find((n) => n.id === need.id)?.match_text).toBe(
      "데이터 분석 협업 파트너 찾는 중",
    );
  });

  it("승인 없으면 draft 유지 + 엔진 텍스트는 빈 값(fail-closed)", async () => {
    const vc = { role: "기업가" as const, personaId: "M-001" };
    await finalizeOnboarding(vc, {
      ...baseInput,
      demand_tags: [
        { tagId: 4, priority: true, detail_quote: "원문만 있는 수요" },
      ],
      consents: {
        publish_profile: true,
        use_private_needs_for_matching: true,
        quote_in_intro: false,
      },
    });
    const stored =
      useSessionInteractionStore.getState().onboardingResults["M-001"];
    expect(stored.needs[0].safe_match_status).toBe("draft");
    const { input } = runMatchingEngine(snapshotSessionState());
    expect(
      input.needs.find((n) => n.id === stored.needs[0].id)?.match_text,
    ).toBe("");
  });

  it("매칭 동의(B) 없이 승인 의사만 있으면 영수증 발급 없이 draft 유지", async () => {
    const vc = { role: "기업가" as const, personaId: "M-001" };
    await finalizeOnboarding(vc, {
      ...baseInput,
      demand_tags: [
        {
          tagId: 4,
          priority: true,
          detail_quote: "원문",
          safe_match: { approved: true, text: "승인 문구" },
        },
      ],
      consents: {
        publish_profile: true,
        use_private_needs_for_matching: false,
        quote_in_intro: false,
      },
    });
    const stored =
      useSessionInteractionStore.getState().onboardingResults["M-001"];
    expect(stored.needs[0].safe_match_status).toBe("draft");
    expect(stored.needs[0].safe_match_receipt).toBeUndefined();
  });
});
