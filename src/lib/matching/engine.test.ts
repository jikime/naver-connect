// 매칭 엔진 유닛 — reciprocal need↔offer 엔진의 계약 회귀 방지:
// hard filter 위반 0 / 결합식 부등식 / safe-text-only(원문 비유출) / 결정성.
// 입력은 EngineNeed/EngineOffer DTO — detail_quote는 타입 레벨에서 들어올 수 없다.
// 근거: people_match_retrieval_plan.md §6, codex-m0m1-review-changes-requested P1-1·P2-1

import { describe, expect, it } from "vitest";
import type {
  EngineInput,
  EngineNeed,
  EngineOffer,
} from "@/lib/matching/engine";
import { runEngine } from "@/lib/matching/engine";
import { buildExplanation } from "@/lib/matching/explain";
import { evaluateHardFilters } from "@/lib/matching/hard-filters";
import { combineReciprocal, needOfferScore } from "@/lib/matching/score";

function must<T>(v: T | undefined, label = "value"): T {
  if (v === undefined) throw new Error(`expected ${label} to exist`);
  return v;
}

// ── 픽스처(로컬 리터럴 — visibility-mask.test.ts 선례). match_text = 승인된 매칭 요약문 ──
const need = (
  id: string,
  ownerId: string,
  tagIds: number[],
  matchText: string,
  priority: "primary" | "normal" = "normal",
): EngineNeed => ({
  id,
  ownerId,
  tag_ids: tagIds,
  match_text: matchText,
  priority,
  urgency: "active",
  constraints: [],
  status: "active",
});

const offer = (
  id: string,
  ownerId: string,
  tagIds: number[],
  detail: string,
): EngineOffer => ({
  id,
  ownerId,
  tag_ids: tagIds,
  detail,
  status: "active",
});

const baseInput = (): EngineInput => ({
  personIds: ["A", "B"],
  needs: [
    need("need-A-1", "A", [1], "판로를 열고 싶어요", "primary"),
    need("need-B-1", "B", [4], "웹사이트 만들 사람이 필요해요"),
  ],
  offers: [
    offer("offer-A-1", "A", [4], "웹 개발 10년"),
    offer("offer-B-1", "B", [1], "유통망 소개 가능"),
  ],
  impactIntents: [],
  personContext: {
    A: {
      region: { sido: "전북", sigungu: "완주" },
      fieldIds: [5],
      keywords: [],
    },
    B: {
      region: { sido: "전북", sigungu: "전주" },
      fieldIds: [5],
      keywords: [],
    },
  },
  orgEdges: [],
  declines: [],
  hasMatchingConsent: () => true,
  ruleWeights: [],
});

describe("evaluateHardFilters — 위반 0 계약", () => {
  it("본인 pair는 SELF 코드로 차단된다", () => {
    const r = evaluateHardFilters("A", "A", baseInput());
    expect(r.pass).toBe(false);
    expect(r.codes).toContain("SELF");
  });

  it("매칭 동의가 없는 회원은 NO_MATCHING_CONSENT로 차단된다 (동의 철회=즉시 제외)", () => {
    const input = {
      ...baseInput(),
      hasMatchingConsent: (id: string) => id !== "B",
    };
    const r = evaluateHardFilters("A", "B", input);
    expect(r.pass).toBe(false);
    expect(r.codes).toContain("NO_MATCHING_CONSENT");
  });

  it("'이미아는사이' 거절 이력 pair는 방향과 무관하게 차단된다", () => {
    const input = {
      ...baseInput(),
      declines: [{ fromId: "B", toId: "A", reason: "이미아는사이" as const }],
    };
    expect(evaluateHardFilters("A", "B", input).pass).toBe(false);
    expect(evaluateHardFilters("B", "A", input).pass).toBe(false);
  });

  it.each([
    "여력없음",
    "접점약함",
    "이미아는사이",
    "관심없음",
    "기타",
  ] as const)(
    "%s 거절은 현재 세션에서 같은 방향 재노출을 차단한다",
    (reason) => {
      const input = {
        ...baseInput(),
        declines: [{ fromId: "A", toId: "B", reason }],
      };
      expect(evaluateHardFilters("A", "B", input).pass).toBe(false);
    },
  );

  it.each(["여력없음", "접점약함", "관심없음", "기타"] as const)(
    "%s 거절은 반대 방향까지 차단하지 않는다",
    (reason) => {
      const input = {
        ...baseInput(),
        declines: [{ fromId: "A", toId: "B", reason }],
      };
      expect(evaluateHardFilters("B", "A", input).pass).toBe(true);
    },
  );

  it("paused 상태 offer만 가진 상대는 CAPACITY_PAUSED로 차단된다", () => {
    const input = baseInput();
    input.offers = input.offers.map((o) =>
      o.ownerId === "B" ? { ...o, capacity: { status: "paused" as const } } : o,
    );
    const r = evaluateHardFilters("A", "B", input);
    expect(r.pass).toBe(false);
    expect(r.codes).toContain("CAPACITY_PAUSED");
  });

  it("엔진이 평가할 수 없는 required 제약은 조용히 통과시키지 않고 차단한다 (P2-1 fail-closed)", () => {
    const input = baseInput();
    input.needs = input.needs.map((n) =>
      n.ownerId === "A"
        ? {
            ...n,
            constraints: [
              {
                kind: "mode" as const,
                strength: "required" as const,
                values: ["온라인"],
              },
            ],
          }
        : n,
    );
    const r = evaluateHardFilters("A", "B", input);
    expect(r.pass).toBe(false);
    expect(r.codes).toContain("REQUIRED_CONSTRAINT_UNSUPPORTED");
  });
});

describe("needOfferScore — 방향 점수", () => {
  it("태그가 겹치는 need→offer는 0보다 크고, 전혀 무관하면 0이다", () => {
    const hit = needOfferScore(
      need("n1", "A", [1], "판로 개척이 급해요", "primary"),
      offer("o1", "B", [1], "유통망 소개와 판로 자문"),
    );
    const miss = needOfferScore(
      need("n2", "A", [3], "인허가 대응"),
      offer("o2", "B", [12], "강의 제공"),
    );
    expect(hit).toBeGreaterThan(0);
    expect(miss).toBe(0);
  });

  it("최우선(primary) need는 같은 조건의 normal보다 점수가 높다 (FR-ON-02 ★ 반영)", () => {
    const p = needOfferScore(
      need("n1", "A", [1], "판로", "primary"),
      offer("o1", "B", [1], "판로 자문"),
    );
    const n = needOfferScore(
      need("n2", "A", [1], "판로", "normal"),
      offer("o1", "B", [1], "판로 자문"),
    );
    expect(p).toBeGreaterThan(n);
  });

  it("match_text가 비어 있어도(미승인) 태그 신호만으로 점수가 나온다 — safe-text-only 계약", () => {
    const s = needOfferScore(
      need("n1", "A", [1], ""),
      offer("o1", "B", [1], "유통망 소개"),
    );
    expect(s).toBeGreaterThan(0);
  });
});

describe("combineReciprocal — 결합식 3종", () => {
  it("양의 f,r에 대해 min ≤ harmonic ≤ geometric 부등식을 만족한다", () => {
    const c = combineReciprocal(0.9, 0.3);
    expect(c.min).toBeLessThanOrEqual(c.harmonic + 1e-9);
    expect(c.harmonic).toBeLessThanOrEqual(c.geometric + 1e-9);
  });

  it("한쪽이 0이면 세 결합식 모두 0이다 — 일방적 매칭 억제", () => {
    const c = combineReciprocal(0.8, 0);
    expect(c.min).toBe(0);
    expect(c.geometric).toBe(0);
    expect(c.harmonic).toBe(0);
  });
});

describe("runEngine — 통합", () => {
  it("전수 방향 pair에서 hard filter 통과분만 점수를 받고 위반 pair는 순위에 없다", () => {
    const input = {
      ...baseInput(),
      declines: [{ fromId: "A", toId: "B", reason: "관심없음" as const }],
    };
    const out = runEngine(input);
    expect(out.pairs.some((p) => p.from === "A" && p.to === "B")).toBe(false);
    expect(out.pairs.some((p) => p.from === "B" && p.to === "A")).toBe(true);
    expect(out.filtered.some((f) => f.from === "A" && f.to === "B")).toBe(true);
  });

  it("보완형 상호 매칭(A수요↔B공급, B수요↔A공급)은 양방향 모두 0점 초과·100점 이하다", () => {
    const out = runEngine(baseInput());
    const ab = must(
      out.pairs.find((p) => p.from === "A" && p.to === "B"),
      "A→B pair",
    );
    expect(ab.score).toBeGreaterThan(0);
    expect(ab.score).toBeLessThanOrEqual(100);
    expect(ab.axis).toBe("차이점");
  });

  it("같은 입력에 대해 결정적으로 같은 출력을 낸다", () => {
    const a = JSON.stringify(runEngine(baseInput()));
    const b = JSON.stringify(runEngine(baseInput()));
    expect(a).toBe(b);
  });

  it("운영자 가중치가 매칭 키워드에 걸리면 점수가 상향된다 (RuleWeight 레버 보존)", () => {
    const plain = runEngine(baseInput());
    const boosted = runEngine({
      ...baseInput(),
      ruleWeights: [{ keyword: "판로", weight: 2 }],
    });
    const p0 = must(
      plain.pairs.find((p) => p.from === "A" && p.to === "B"),
    ).score;
    const p1 = must(
      boosted.pairs.find((p) => p.from === "A" && p.to === "B"),
    ).score;
    expect(p1).toBeGreaterThan(p0);
  });
});

describe("buildExplanation — 최소 노출 계약 (BR-01 + safe-text-only)", () => {
  it("설명에는 상대의 매칭 텍스트가 포함되지 않고 태그 수준으로만 언급된다", () => {
    const input = baseInput();
    const out = runEngine(input);
    const ab = must(out.pairs.find((p) => p.from === "A" && p.to === "B"));
    const text = JSON.stringify(buildExplanation(ab, input));
    // 상대(B)의 텍스트는 태그 수준으로만 — 승인 텍스트라도 상호 수락 전 비인용
    expect(text).not.toContain("웹사이트 만들 사람이 필요해요");
    // 본인(A)의 승인된 match_text 인용은 허용(자기 정보)
    expect(text).toContain("판로를 열고 싶어요");
  });

  it("match_text가 비어 있으면(미승인) 본인 몫도 태그 수준 문장으로 대체된다", () => {
    const input = baseInput();
    input.needs = input.needs.map((n) =>
      n.ownerId === "A" ? { ...n, match_text: "" } : n,
    );
    const out = runEngine(input);
    const ab = must(out.pairs.find((p) => p.from === "A" && p.to === "B"));
    const ex = buildExplanation(ab, input);
    expect(ex.your_need.text).not.toContain("판로를 열고 싶어요");
    expect(ex.your_need.text.length).toBeGreaterThan(0);
  });

  it("설명 4요소(내 필요/상대 제공/상대 이익/첫 행동)가 모두 채워진다", () => {
    const input = baseInput();
    const out = runEngine(input);
    const ab = must(out.pairs.find((p) => p.from === "A" && p.to === "B"));
    const ex = buildExplanation(ab, input);
    expect(ex.your_need.text.length).toBeGreaterThan(0);
    expect(ex.their_offer.text.length).toBeGreaterThan(0);
    expect(ex.their_benefit.text.length).toBeGreaterThan(0);
    expect(ex.first_action.text.length).toBeGreaterThan(0);
  });
});
