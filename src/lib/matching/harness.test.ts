// 평가 하니스 계약 테스트 — 실시드(8명) 전수 pair에 대한 안전·품질 불변식.
// HardFilterViolation=0 / 비공개 원문·PII 누출=0 / 전원 커버리지 / 시드 추천 방향 재현.
// ⚠️ n=8·추천 11건은 regression smoke일 뿐 품질 gold가 아니다(통계적 유의성 없음).
// 근거: people_match_retrieval_plan.md §8, plans/generic-mixing-seahorse.md M1-9

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import membersSeed from "@/data/members.json";
import needsSeed from "@/data/private/people/needs.json";
import recommendationsSeed from "@/data/private/recommendations.json";
import {
  buildEngineRecommendationsFor,
  runMatchingEngine,
} from "@/lib/dal/matching";
import { getRecommendation } from "@/lib/dal/recommendations";
import { submitDecline } from "@/lib/dal/writes";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  DeclineReasonCode,
  NeedIntentV1,
  OnboardingFinalizeInput,
  Recommendation,
} from "@/types";

const members = membersSeed as { id: string }[];
const needs = needsSeed as NeedIntentV1[];
const seedRecs = recommendationsSeed as Recommendation[];

/** 스냅샷 픽스처(P1-3 무손실 계약) — 테스트마다 detail_quote만 바꿔 쓸 수 있게 팩토리로 */
function snapshotFixture(quote: string): OnboardingFinalizeInput {
  return {
    organization: {
      name: "수정한 조직",
      type: "사회적기업",
      role: "대표",
    },
    region: { sido: "서울", sigungu: "성동구" },
    field_tags: [2, 5],
    value_chain_stage: "성장",
    mission_statement: "지역의 돌봄 문제를 연결로 해결합니다",
    demand_tags: [{ tagId: 4, priority: true, detail_quote: quote }],
    supply_tags: [{ tagId: 10, detail: "운영 경험 나눔" }],
    activities: ["학습모임"],
    availability: "월 2~3회",
    preferred_mode: "무관",
    participation_scope: null,
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
}

function onboardingResultWith(quote: string, matching = true) {
  const snapshot = snapshotFixture(quote);
  return {
    snapshot,
    needs: [
      {
        id: "need-session-T-4-0",
        owner: { kind: "person", id: "M-001" },
        tag_ids: [4],
        detail_quote: quote,
        safe_match_status: "draft",
        priority: "primary",
        urgency: "active",
        constraints: [],
        status: "active",
        source: "onboarding",
        profile_revision: 2,
        created_at: "2026-07-29T13:00:00+09:00",
      } as NeedIntentV1,
    ],
    offers: [],
    consents: { publish: true, matching, quote: false },
  };
}

beforeEach(() => {
  useSessionInteractionStore.getState().reset();
});
afterEach(() => {
  process.env.NEXT_PUBLIC_APP_MODE = "demo";
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
  it("세션 온보딩 Need가 해당 persona의 시드를 대체하고, 스냅샷이 무손실 보존된다 (P1-3)", () => {
    const store = useSessionInteractionStore.getState();
    store.storeOnboardingResult(
      "M-001",
      onboardingResultWith("AI 도입을 도와줄 파트너가 필요해요"),
    );
    const { input } = runMatchingEngine();
    const mine = input.needs.filter((n) => n.ownerId === "M-001");
    expect(mine).toHaveLength(1);
    const saved =
      useSessionInteractionStore.getState().onboardingResults["M-001"];
    expect(saved.snapshot).toEqual(
      snapshotFixture("AI 도입을 도와줄 파트너가 필요해요"),
    );
  });

  it("매칭 동의 B를 철회한 persona는 엔진 pair에서 제외된다 (fail-closed)", () => {
    useSessionInteractionStore.getState().storeOnboardingResult("M-002", {
      ...onboardingResultWith("무관"),
      needs: [],
      consents: { publish: true, matching: false, quote: false },
    });
    const { output } = runMatchingEngine();
    expect(
      output.pairs.some((p) => p.from === "M-002" || p.to === "M-002"),
    ).toBe(false);
  });
});

describe("하니스 — safe-text-only 불변식 (EOF blocker)", () => {
  it("raw detail_quote를 바꿔도(미승인 상태) 엔진 출력이 완전히 동일하다", () => {
    const store = useSessionInteractionStore.getState();
    store.storeOnboardingResult("M-001", onboardingResultWith("원문 버전 A"));
    const a = JSON.stringify(runMatchingEngine().output);
    store.storeOnboardingResult(
      "M-001",
      onboardingResultWith(
        "완전히 다른 원문 버전 B — 점수에 쓰였다면 결과가 달라져야 한다",
      ),
    );
    const b = JSON.stringify(runMatchingEngine().output);
    expect(a).toBe(b);
  });

  it("엔진 입력 need에는 detail_quote 키 자체가 존재하지 않는다 (타입+런타임 이중 확인)", () => {
    const { input } = runMatchingEngine();
    for (const n of input.needs) {
      expect("detail_quote" in n).toBe(false);
      expect("safe_match_status" in n).toBe(false);
    }
  });
});

describe("하니스 — P1-2 동의 gate 통합", () => {
  it("APP_MODE가 demo가 아니면 seed_mock 동의는 무효 — 엔진 pair 0건 (fail-closed)", () => {
    process.env.NEXT_PUBLIC_APP_MODE = "";
    const { output } = runMatchingEngine();
    expect(output.pairs).toHaveLength(0);
    expect(
      output.filtered.every((f) => f.codes.includes("NO_MATCHING_CONSENT")),
    ).toBe(true);
  });

  it("원문 주인의 인용 동의(C)가 철회되면 수신 당사자도 원문 대신 최소노출 문구를 본다", async () => {
    // REC-01: from M-003 → to M-004. M-003이 세션 온보딩에서 quote=false로 갱신.
    useSessionInteractionStore
      .getState()
      .storeOnboardingResult("M-003", onboardingResultWith("새 수요"));
    const rec = await getRecommendation(
      { role: "기업가", personaId: "M-004" },
      "REC-01",
    );
    expect(rec.message.contact_point).toBe(rec.min_exposure_note);
  });
});

describe("하니스 — 재리뷰 #5 safe-match provenance (mapper 3중 검증)", () => {
  const confirmedNeed = (over: Partial<NeedIntentV1>): NeedIntentV1 => ({
    id: "need-prov-1",
    owner: { kind: "person", id: "M-001" },
    tag_ids: [4],
    detail_quote: "원문",
    safe_match_text: "승인된 매칭 요약문",
    safe_match_status: "user_confirmed",
    safe_match_confirmed_at: "2026-07-29T13:00:00+09:00",
    priority: "primary",
    urgency: "active",
    constraints: [],
    status: "active",
    source: "onboarding",
    profile_revision: 2,
    created_at: "2026-07-29T13:00:00+09:00",
    ...over,
  });

  it("status+confirmed_at+매칭동의가 모두 있어야 match_text가 엔진에 들어간다", () => {
    useSessionInteractionStore.getState().storeOnboardingResult("M-001", {
      ...onboardingResultWith("무시"),
      needs: [confirmedNeed({})],
    });
    const { input } = runMatchingEngine();
    const mine = input.needs.find((n) => n.ownerId === "M-001");
    expect(mine?.match_text).toBe("승인된 매칭 요약문");
  });

  it("confirmed_at(provenance)이 없으면 status가 user_confirmed여도 match_text는 비운다", () => {
    useSessionInteractionStore.getState().storeOnboardingResult("M-001", {
      ...onboardingResultWith("무시"),
      needs: [confirmedNeed({ safe_match_confirmed_at: undefined })],
    });
    const { input } = runMatchingEngine();
    expect(
      input.needs.find((n) => n.ownerId === "M-001")?.match_text,
    ).toBe("");
  });

  it("매칭 동의(B)가 철회된 owner의 match_text는 mapper 단계에서도 비운다 (hard filter와 이중 방어)", () => {
    useSessionInteractionStore.getState().storeOnboardingResult("M-001", {
      ...onboardingResultWith("무시"),
      needs: [confirmedNeed({})],
      consents: { publish: true, matching: false, quote: false },
    });
    const { input } = runMatchingEngine();
    expect(
      input.needs.find((n) => n.ownerId === "M-001")?.match_text,
    ).toBe("");
  });
});

describe("하니스 — P1-4 엔진 거절 반영·ID 검증 통합", () => {
  it.each<DeclineReasonCode>([
    "여력없음",
    "접점약함",
    "이미아는사이",
    "관심없음",
    "기타",
  ])(
    "%s 거절 후 재실행에서 같은 방향 pair가 재등장하지 않는다",
    async (reason) => {
      const vc = { role: "기업가" as const, personaId: "M-001" };
      const recs = buildEngineRecommendationsFor("M-001");
      expect(recs.length).toBeGreaterThan(0);
      const target = recs[0];
      await submitDecline(vc, target.id, reason);
      const after = buildEngineRecommendationsFor("M-001");
      expect(after.some((r) => r.id === target.id)).toBe(false);
      expect(
        runMatchingEngine().output.pairs.some(
          (p) => p.from === "M-001" && p.to === target.from_member_id,
        ),
      ).toBe(false);
    },
  );

  it("실재하지 않는 엔진 추천 ID에는 반응을 저장할 수 없다", async () => {
    const vc = { role: "기업가" as const, personaId: "M-001" };
    await expect(
      submitDecline(vc, "REC-ENG:M-001:M-999", "관심없음"),
    ).rejects.toThrow();
  });
});
