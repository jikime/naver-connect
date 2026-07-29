// 평가 하니스 계약 테스트 — 실시드(8명) 전수 pair에 대한 안전·품질 불변식.
// HardFilterViolation=0 / 비공개 원문·PII 누출=0 / 전원 커버리지 / 시드 추천 방향 재현.
// ⚠️ n=8·추천 11건은 regression smoke일 뿐 품질 gold가 아니다(통계적 유의성 없음).
// 근거: people_match_retrieval_plan.md §8, plans/generic-mixing-seahorse.md M1-9

import { beforeEach, describe, expect, it } from "vitest";
import membersSeed from "@/data/members.json";
import needsSeed from "@/data/private/people/needs.json";
import recommendationsSeed from "@/data/private/recommendations.json";
import {
  buildEngineRecommendationsFor,
  runMatchingEngine,
} from "@/lib/dal/matching";
import type { NeedIntentV1, Recommendation } from "@/types";
import { useSessionInteractionStore } from "@/stores/session-interaction";

const members = membersSeed as { id: string }[];
const needs = needsSeed as NeedIntentV1[];
const seedRecs = recommendationsSeed as Recommendation[];

beforeEach(() => {
  useSessionInteractionStore.getState().reset();
});

describe("하니스 — hard filter 불변식", () => {
  it("HardFilterViolationRate = 0 — 순위 목록에 filtered pair·자기 자신이 없다", () => {
    const { output } = runMatchingEngine();
    const filteredKeys = new Set(
      output.filtered.map((f) => `${f.from}~${f.to}`),
    );
    for (const p of output.pairs) {
      expect(p.from).not.toBe(p.to);
      expect(filteredKeys.has(`${p.from}~${p.to}`)).toBe(false);
    }
  });

  it("모든 pair 점수는 1..100 범위다", () => {
    const { output } = runMatchingEngine();
    for (const p of output.pairs) {
      expect(p.score).toBeGreaterThan(0);
      expect(p.score).toBeLessThanOrEqual(100);
    }
  });
});

describe("하니스 — 비공개 원문 누출 0", () => {
  it("엔진 추천 직렬화 결과에 어떤 회원의 need 원문(detail_quote)도 포함되지 않는다", () => {
    const quotes = needs
      .map((n) => n.detail_quote)
      .filter((q) => q.length >= 8);
    for (const m of members) {
      const payload = JSON.stringify(buildEngineRecommendationsFor(m.id));
      for (const quote of quotes) {
        expect(payload.includes(quote)).toBe(false);
      }
    }
  });
});

describe("하니스 — 커버리지·재현 smoke", () => {
  it("8명 전원이 엔진 추천을 1건 이상 받는다 (고립 회원 0 — 최우선 골)", () => {
    for (const m of members) {
      const recs = buildEngineRecommendationsFor(m.id);
      expect(recs.length).toBeGreaterThan(0);
    }
  });

  it("수동 시드 1:1 추천 pair는 엔진에서도 hard filter를 통과한다 (smoke — 방향 재현율 100%)", () => {
    const { output } = runMatchingEngine();
    const pairKeys = new Set(output.pairs.map((p) => `${p.from}~${p.to}`));
    const oneToOne = seedRecs.filter(
      (r) => r.rec_kind === "1:1" && r.to_member_id,
    );
    for (const rec of oneToOne) {
      // 시드 추천의 수신자(to) 관점 pair가 엔진 순위에 존재해야 한다
      expect(pairKeys.has(`${rec.to_member_id}~${rec.from_member_id}`)).toBe(
        true,
      );
    }
  });

  it("결합식 3종이 pair마다 모두 산출된다 (min ≤ harmonic ≤ geometric)", () => {
    const { output } = runMatchingEngine();
    for (const p of output.pairs) {
      if (p.reciprocal.min > 0) {
        expect(p.reciprocal.min).toBeLessThanOrEqual(
          p.reciprocal.harmonic + 1e-9,
        );
        expect(p.reciprocal.harmonic).toBeLessThanOrEqual(
          p.reciprocal.geometric + 1e-9,
        );
      }
    }
  });
});

describe("하니스 — 온보딩 적립 → 엔진 즉시 반영", () => {
  it("세션 온보딩 Need/Offer가 해당 persona의 시드를 대체하고 추천에 반영된다", () => {
    const store = useSessionInteractionStore.getState();
    store.storeOnboardingResult("M-001", {
      needs: [
        {
          id: "need-session-M-001-4-0",
          owner: { kind: "person", id: "M-001" },
          tag_ids: [4],
          detail_quote: "AI 도입을 도와줄 파트너가 필요해요",
          safe_match_status: "draft",
          priority: "primary",
          urgency: "active",
          constraints: [],
          status: "active",
          source: "onboarding",
          profile_revision: 2,
          created_at: "2026-07-29T13:00:00+09:00",
        },
      ],
      offers: [],
      matchingConsent: true,
    });
    const { input } = runMatchingEngine();
    const mine = input.needs.filter((n) => n.owner.id === "M-001");
    expect(mine).toHaveLength(1);
    expect(mine[0].source).toBe("onboarding");
  });

  it("매칭 동의 B를 철회한 persona는 엔진 pair에서 제외된다 (fail-closed)", () => {
    useSessionInteractionStore.getState().storeOnboardingResult("M-002", {
      needs: [],
      offers: [],
      matchingConsent: false,
    });
    const { output } = runMatchingEngine();
    expect(
      output.pairs.some((p) => p.from === "M-002" || p.to === "M-002"),
    ).toBe(false);
  });
});
