// writes DAL 유닛 — 거절/후기 세션 반영(FR-FB-*), 타인 추천 조작 방지 회귀 방지.
// 근거: TASKS.md T-003 Verification/Acceptance

import { beforeEach, describe, expect, it } from "vitest";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import { getRecommendation } from "./recommendations";
import {
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
