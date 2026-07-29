// vocabulary 유닛 — versioned vocabulary 해석 규칙 회귀 방지 (표시명 덮어쓰기 금지, blocked 라벨 노출 차단)
// 근거: research_synthesis.md §6.3(versioned vocabulary), people_match_retrieval_plan.md §4.2, plans/generic-mixing-seahorse.md M0-1

import { describe, expect, it } from "vitest";
import {
  findConceptIdByLabel,
  getActiveRelease,
  resolveDisplayLabel,
  resolveLabelAt,
} from "@/lib/vocabulary";

describe("getActiveRelease", () => {
  it("role-terms 릴리스를 로드하고 semver 버전을 노출한다 (§6.3 release)", () => {
    const file = getActiveRelease();
    expect(file.release.version).toMatch(/^role-terms\/\d+\.\d+\.\d+$/);
    expect(file.concepts.length).toBeGreaterThanOrEqual(4);
  });
});

describe("resolveDisplayLabel", () => {
  it("고정 후보 용어를 preferred 라벨로 해석한다 (사용자 확정: 활동가→사회혁신활동가, 지원가→사회혁신지원가)", () => {
    expect(resolveDisplayLabel("nvc.role.activist")).toBe("사회혁신활동가");
    expect(resolveDisplayLabel("nvc.role.supporter")).toBe("사회혁신지원가");
  });

  it("C그룹은 임시 preferred '사회혁신 협력 파트너'로 해석하고 legacy '비사회적기업'을 절대 반환하지 않는다 (blocked)", () => {
    const label = resolveDisplayLabel("nvc.role.ally");
    expect(label).toBe("사회혁신 협력 파트너");
    expect(label).not.toContain("비사회적");
  });

  it("존재하지 않는 concept은 throw한다", () => {
    expect(() => resolveDisplayLabel("nvc.role.ghost")).toThrow();
  });
});

describe("findConceptIdByLabel — 검색은 alias를 받되 표시는 preferred만", () => {
  it("deprecated alias(활동가)로 검색하면 같은 concept으로 매핑된다", () => {
    expect(findConceptIdByLabel("활동가")).toBe("nvc.role.activist");
    expect(findConceptIdByLabel("지원가")).toBe("nvc.role.supporter");
  });

  it("blocked 라벨(비사회적기업)도 과거 데이터 해석을 위해 검색은 허용된다", () => {
    expect(findConceptIdByLabel("비사회적기업")).toBe("nvc.role.ally");
  });

  it("preferred 라벨 자신으로도 검색된다", () => {
    expect(findConceptIdByLabel("사회혁신활동가")).toBe("nvc.role.activist");
  });

  it("미등록 라벨은 undefined를 반환한다", () => {
    expect(findConceptIdByLabel("갑을관계자")).toBeUndefined();
  });
});

describe("resolveLabelAt — 시점 스냅샷 재현 (과거 이벤트는 당시 라벨로)", () => {
  it("release 발효 이전 시점은 당시 활성이던 legacy 라벨을 반환한다", () => {
    expect(
      resolveLabelAt("nvc.role.activist", "2026-01-01T00:00:00+09:00"),
    ).toBe("활동가");
  });

  it("발효 이후 시점은 preferred 라벨을 반환한다", () => {
    expect(
      resolveLabelAt("nvc.role.activist", "2026-07-30T00:00:00+09:00"),
    ).toBe("사회혁신활동가");
  });
});
