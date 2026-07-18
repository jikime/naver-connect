// DAL 회원 read 유닛 — 재조립·마스킹 계약 회귀 방지.
// 근거: TASKS.md T-002 Verification/Self-check(8인 전원 커버, 비운영자 private null)

import { describe, expect, it } from "vitest";
import { getMember, getMembers } from "./members";

describe("getMembers", () => {
  it("페르소나 8인 전원을 재조립 오류 없이 반환한다", async () => {
    const members = await getMembers({ role: "운영자", personaId: "M-001" });
    expect(members).toHaveLength(8);
  });

  it("비운영자·비본인 뷰어는 전원의 visibility.private가 null이다", async () => {
    const members = await getMembers({ role: "기업가", personaId: "M-001" });
    const others = members.filter((m) => m.id !== "M-001");
    expect(others.length).toBeGreaterThan(0);
    for (const member of others) {
      expect(member.visibility.private).toBeNull();
    }
    // 본인은 유지
    const self = members.find((m) => m.id === "M-001");
    expect(self?.visibility.private).not.toBeNull();
  });
});

describe("getMember", () => {
  it("MaskedMember 형태로 반환하고, 비운영자 뷰어에서 타인 조회 시 private가 null이다", async () => {
    const masked = await getMember(
      { role: "전문가", personaId: "M-005" },
      "M-002",
    );
    expect(masked.id).toBe("M-002");
    expect(masked.visibility.public).toBeDefined();
    expect(masked.visibility.private).toBeNull();
  });

  it("존재하지 않는 id는 reject된다", async () => {
    await expect(
      getMember({ role: "운영자", personaId: "M-001" }, "M-999"),
    ).rejects.toThrow();
  });
});
