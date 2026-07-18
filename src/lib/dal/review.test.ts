// review DAL 유닛 — 403 시뮬레이션(FR-OP-01)·승인 상태 전이(FR-OP-04) 회귀 방지.
// 근거: TASKS.md T-003 Verification/Acceptance

import { beforeEach, describe, expect, it } from "vitest";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import { ForbiddenError } from "./errors";
import {
  approveRecommendation,
  getReviewQueue,
  rejectRecommendation,
} from "./review";

beforeEach(() => {
  useSessionInteractionStore.getState().reset();
});

describe("getReviewQueue", () => {
  it("비운영자 뷰어는 ForbiddenError로 reject된다(403 시뮬레이션)", async () => {
    await expect(
      getReviewQueue({ role: "기업가", personaId: "M-001" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("운영자 뷰어는 draft/pending_review 전건을 받는다(BR-05)", async () => {
    const queue = await getReviewQueue({
      role: "운영자",
      personaId: "OPERATOR",
    });
    expect(queue.length).toBeGreaterThan(0);
    expect(
      queue.every((r) => r.status === "draft" || r.status === "pending_review"),
    ).toBe(true);
  });
});

describe("approveRecommendation", () => {
  it("비운영자 뷰어는 reject된다", async () => {
    await expect(
      approveRecommendation({ role: "전문가", personaId: "M-005" }, "REC-03"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("운영자 승인 시 status가 sent로 전이된다(FR-OP-04)", async () => {
    const updated = await approveRecommendation(
      { role: "운영자", personaId: "OPERATOR" },
      "REC-03",
    );
    expect(updated.status).toBe("sent");
    const queue = await getReviewQueue({
      role: "운영자",
      personaId: "OPERATOR",
    });
    expect(queue.find((r) => r.id === "REC-03")).toBeUndefined();
  });
});

describe("rejectRecommendation", () => {
  it("운영자 반려 시 status가 rejected로 전이되고 검수 큐에서 사라진다(approveRecommendation과 대칭)", async () => {
    const updated = await rejectRecommendation(
      { role: "운영자", personaId: "OPERATOR" },
      "REC-04",
    );
    expect(updated.status).toBe("rejected");
    const queue = await getReviewQueue({
      role: "운영자",
      personaId: "OPERATOR",
    });
    expect(queue.find((r) => r.id === "REC-04")).toBeUndefined();
  });
});
