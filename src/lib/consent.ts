// 목적별 동의 판정(클라이언트 안전) — consent 레코드 원본 대신 파생 자격 요약만 사용한다.
// 우선순위: 세션 온보딩 동의(실제 사용자 행동) > seed_mock(단, APP_MODE=demo에서만 유효).
// demo가 아니면 seed_mock은 무효 → fail-closed (P1-2).
// 근거: codex-m0m1-review-changes-requested P1-2, research_synthesis.md §11

import eligibilitySeed from "@/data/people/derived/matching-eligibility.json";
import { isDemoMode } from "@/lib/app-mode";
import { useSessionInteractionStore } from "@/stores/session-interaction";

export interface ConsentFlags {
  publish: boolean;
  matching: boolean;
  quote: boolean;
}

const NO_CONSENT: ConsentFlags = {
  publish: false,
  matching: false,
  quote: false,
};

const seedPurposes = new Map(
  (eligibilitySeed as { person_id: string; purposes: string[] }[]).map((e) => [
    e.person_id,
    new Set(e.purposes),
  ]),
);

/** personId의 현재 유효 동의 플래그. 철회·미동의·비데모 seed_mock은 전부 false. */
export function getConsentFlags(personId: string): ConsentFlags {
  const session =
    useSessionInteractionStore.getState().onboardingResults[personId];
  if (session) return session.consents;
  if (isDemoMode()) {
    const purposes = seedPurposes.get(personId);
    if (purposes) {
      return {
        publish: purposes.has("publish_profile"),
        matching: purposes.has("use_private_needs_for_matching"),
        quote: purposes.has("quote_in_intro"),
      };
    }
  }
  return NO_CONSENT;
}
