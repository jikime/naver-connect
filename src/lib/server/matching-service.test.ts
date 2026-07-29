// 매칭 서비스 gate 유닛 — C4: 모둠 동의(참여자 전원)·non-demo seed 모둠 차단(#2),
// declined 5종 주간 재노출 0건·그래프 미광고(#3). 승인 조건(final-rereview REJECT) 회귀 방지.
// 근거: codex final-rereview-reject #2·#3, decline_reasons.json 5종, meetups.json MU-001

import { afterEach, describe, expect, it, vi } from "vitest";
import declineReasonsSeed from "@/data/decline_reasons.json";
import recommendationsOriginalSeed from "@/data/private/recommendations.json";
import { hashSafeMatchText } from "@/lib/matching/receipt";
import type {
  MatchingRequest,
  MatchingSessionState,
} from "@/lib/server/matching-service";
import {
  computeMatchingBundle,
  confirmSafeMatchTexts,
  runMatchingEngine,
} from "@/lib/server/matching-service";
import type { DeclineReasonCode, Recommendation } from "@/types";

const recsOriginal = recommendationsOriginalSeed as Recommendation[];
const groupSeedIds = recsOriginal
  .filter((r) => r.rec_kind === "모둠")
  .map((r) => r.id);
const ALL_DECLINE_REASONS = (
  declineReasonsSeed as { code: DeclineReasonCode }[]
).map((r) => r.code);

const EMPTY: MatchingSessionState = {
  onboardingResults: {},
  recommendationOverrides: {},
  ruleWeightOverrides: null,
};

function request(
  personaId: string,
  role: MatchingRequest["role"] = "기업가",
  session: MatchingSessionState = EMPTY,
): MatchingRequest {
  return { personaId, role, session };
}

/** 온보딩 결과 최소 픽스처 — 매칭 동의 여부만 관찰 대상. */
function onboardingWithMatchingConsent(matching: boolean) {
  return {
    snapshot: {
      organization: { name: "테스트 조합", type: "사회적기업", role: "이사" },
      region: { sido: "전북", sigungu: "전주시" },
      field_tags: [1],
      value_chain_stage: "성장",
      mission_statement: "테스트 미션",
      demand_tags: [],
      supply_tags: [],
      activities: [],
      availability: "월 1회",
      preferred_mode: "온라인 선호",
      participation_scope: "개인 자격으로 참여",
      hot_lead: null,
      readiness: "탐색 중이에요",
      trust_connections: [],
      consents: {
        publish_profile: false,
        use_private_needs_for_matching: matching,
        quote_in_intro: false,
      },
      visibility_consent: true,
    },
    needs: [],
    offers: [],
    consents: { publish: false, matching, quote: false },
    // biome-ignore lint/suspicious/noExplicitAny: OnboardingFinalizeInput 전체 필드 대신 gate 관찰에 필요한 최소 형태만 구성
  } as any;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("C4 #2 — 모둠 동의 gate", () => {
  it("demo에서 참여자 전원(개설자 포함) 매칭 동의가 유효하면 모둠 시드가 허용된다", () => {
    const bundle = computeMatchingBundle(request("M-001"));
    expect(bundle.allowedSeedRecIds).toContain("REC-05");
  });

  it("참여자 1명이 세션 온보딩에서 매칭 동의를 철회하면 모둠 전체가 제외된다", () => {
    // REC-05 = MU-001, 참여자 M-006·M-001·M-002. M-002가 동의 철회.
    const session: MatchingSessionState = {
      ...EMPTY,
      onboardingResults: { "M-002": onboardingWithMatchingConsent(false) },
    };
    const bundle = computeMatchingBundle(request("M-001", "기업가", session));
    expect(bundle.allowedSeedRecIds).not.toContain("REC-05");
    expect(bundle.graphEdges.filter((e) => e.rec_kind === "모둠")).toHaveLength(
      0,
    );
  });

  it("non-demo에서는 seed 모둠이 0건이다(운영자 포함, 승인 조건)", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "pilot");
    for (const req of [request("M-001"), request("M-001", "운영자")]) {
      const bundle = computeMatchingBundle(req);
      for (const groupId of groupSeedIds) {
        expect(bundle.allowedSeedRecIds).not.toContain(groupId);
      }
      expect(
        bundle.graphEdges.filter((e) => e.rec_kind === "모둠"),
      ).toHaveLength(0);
    }
  });
});

describe("C4 #3 — declined 재노출 차단", () => {
  it("원본 status=declined 시드(REC-06)는 당사자 hidden 집합에 들어가고 그래프에 없다", () => {
    // REC-06: M-001 → M-004, decline_reason=접점약함(시드 원본).
    for (const personaId of ["M-001", "M-004"]) {
      const bundle = computeMatchingBundle(request(personaId));
      expect(bundle.hiddenSeedRecIds).toContain("REC-06");
      expect(bundle.graphEdges.map((e) => e.id)).not.toContain("REC-06");
    }
  });

  it("세션 override 거절은 5개 사유 전부 hidden 집합·그래프에서 제외된다", () => {
    expect(ALL_DECLINE_REASONS).toHaveLength(5);
    for (const reason of ALL_DECLINE_REASONS) {
      // REC-02: M-004 → M-003, 원본 status=sent.
      const session: MatchingSessionState = {
        ...EMPTY,
        recommendationOverrides: {
          "REC-02": { status: "declined", decline_reason: reason },
        },
      };
      const bundle = computeMatchingBundle(request("M-003", "기업가", session));
      expect(bundle.hiddenSeedRecIds).toContain("REC-02");
      expect(bundle.graphEdges.map((e) => e.id)).not.toContain("REC-02");
      // 동의 gate(allowed)는 유지 — 상세 영수증 조회 경로는 살아 있어야 한다.
      expect(bundle.allowedSeedRecIds).toContain("REC-02");
    }
  });

  it("hidden 집합은 당사자·운영자 스코프다 — 제3자에게 타인 거절 상태를 열거하지 않는다", () => {
    // REC-06의 당사자가 아닌 M-007 관점.
    const bundle = computeMatchingBundle(request("M-007", "전문가"));
    expect(bundle.hiddenSeedRecIds).not.toContain("REC-06");
    const operator = computeMatchingBundle(request("M-007", "운영자"));
    expect(operator.hiddenSeedRecIds).toContain("REC-06");
  });
});

describe("C4 — 모둠 그래프 엣지 서버 이관", () => {
  it("모둠 참여자는 본인이 endpoint인 엣지만, 개설자·운영자는 전체를 받고, 비참여자는 0건이다", () => {
    // 열거 불변식: 일반 회원 엣지는 항상 본인이 endpoint(기존 1:1 계약과 동일).
    const participant = computeMatchingBundle(request("M-001"));
    const participantGroup = participant.graphEdges.filter(
      (e) => e.rec_kind === "모둠",
    );
    expect(participantGroup.map((e) => e.id)).toEqual(["REC-05:M-001"]);

    const organizer = computeMatchingBundle(request("M-006", "전문가"));
    const organizerGroup = organizer.graphEdges.filter(
      (e) => e.rec_kind === "모둠",
    );
    expect(organizerGroup.map((e) => e.id).sort()).toEqual([
      "REC-05:M-001",
      "REC-05:M-002",
    ]);
    expect(organizerGroup.every((e) => e.from === "M-006")).toBe(true);

    const operator = computeMatchingBundle(request("M-999", "운영자"));
    expect(
      operator.graphEdges.filter((e) => e.rec_kind === "모둠").length,
    ).toBeGreaterThanOrEqual(2);

    const outsider = computeMatchingBundle(request("M-007", "전문가"));
    expect(
      outsider.graphEdges.filter((e) => e.rec_kind === "모둠"),
    ).toHaveLength(0);
  });
});

describe("confirmSafeMatchTexts — 서버 발급(M2 온보딩 보완 #1)", () => {
  const sessionWith = (personaId: string, matching: boolean) => ({
    ...EMPTY,
    onboardingResults: {
      [personaId]: {
        ...onboardingWithMatchingConsent(matching),
        needs: [
          {
            id: `need-session-${personaId}-4-0`,
            owner: { kind: "person", id: personaId },
            tag_ids: [4],
            detail_quote: "원문입니다",
            safe_match_status: "draft",
            priority: "primary",
            urgency: "active",
            constraints: [],
            status: "active",
            source: "onboarding",
            profile_revision: 2,
            created_at: "2026-07-29T15:00:00+09:00",
          },
        ],
      },
    },
  });

  it("매칭 동의가 있으면 영수증을 발급하고, 그 영수증은 전수 검증을 통과한다", () => {
    const session = sessionWith("M-001", true) as MatchingSessionState;
    const results = confirmSafeMatchTexts({
      personaId: "M-001",
      approvals: [{ needId: "need-session-M-001-4-0", text: "승인 요약문" }],
      session,
    });
    expect(results).toHaveLength(1);
    const { receipt, text } = results[0];
    expect(text).toBe("승인 요약문");
    expect(receipt.confirmer_person_id).toBe("M-001");
    expect(receipt.consent_receipt_id).toContain("consent-session-M-001");
    // 발급된 영수증으로 need를 확정하면 엔진 입력에 텍스트가 실린다.
    session.onboardingResults["M-001"].needs[0] = {
      ...session.onboardingResults["M-001"].needs[0],
      safe_match_text: text,
      safe_match_status: "user_confirmed",
      safe_match_receipt: receipt,
    };
    const { input } = runMatchingEngine(session);
    const need = input.needs.find((n) => n.id === "need-session-M-001-4-0");
    expect(need?.match_text).toBe("승인 요약문");
  });

  it("매칭 동의가 없으면 발급을 거부한다", () => {
    expect(() =>
      confirmSafeMatchTexts({
        personaId: "M-001",
        approvals: [{ needId: "need-session-M-001-4-0", text: "요약" }],
        session: sessionWith("M-001", false) as MatchingSessionState,
      }),
    ).toThrow();
  });

  it("타인 need·빈 문구·없는 need는 전부 거부한다(fail-closed)", () => {
    const session = sessionWith("M-001", true) as MatchingSessionState;
    expect(() =>
      confirmSafeMatchTexts({
        personaId: "M-002",
        approvals: [{ needId: "need-session-M-001-4-0", text: "요약" }],
        session,
      }),
    ).toThrow();
    expect(() =>
      confirmSafeMatchTexts({
        personaId: "M-001",
        approvals: [{ needId: "need-session-M-001-4-0", text: "   " }],
        session,
      }),
    ).toThrow();
    expect(() =>
      confirmSafeMatchTexts({
        personaId: "M-001",
        approvals: [{ needId: "need-없음", text: "요약" }],
        session,
      }),
    ).toThrow();
  });

  it("위조된 consent_receipt_id를 단 세션 need는 엔진에서 텍스트가 빠진다", () => {
    const session = sessionWith("M-001", true) as MatchingSessionState;
    const base = session.onboardingResults["M-001"].needs[0];
    session.onboardingResults["M-001"].needs[0] = {
      ...base,
      safe_match_text: "위조 시도",
      safe_match_status: "user_confirmed",
      safe_match_receipt: {
        confirmed_at: "2026-07-29T15:01:00+09:00",
        confirmer_person_id: "M-001",
        source_revision: 2,
        content_hash: hashSafeMatchText("위조 시도"),
        consent_receipt_id: "consent-위조-임의문자열",
      },
    };
    const { input } = runMatchingEngine(session);
    const need = input.needs.find((n) => n.id === "need-session-M-001-4-0");
    expect(need?.match_text).toBe("");
  });
});
