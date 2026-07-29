import type { OnboardingResult } from "@/stores/session-interaction";
import type {
  CapabilityOfferV1,
  NeedIntentV1,
  OnboardingFinalizeInput,
  SafeMatchReceipt,
} from "@/types";

export interface SafeTextConfirmation {
  needId: string;
  text: string;
  receipt: SafeMatchReceipt;
}

/** 온보딩 원문을 매칭 엔진이 사용하는 구조화 결과로 무손실 변환한다. */
export function buildOnboardingResult(
  personaId: string,
  profile: OnboardingFinalizeInput,
  createdAt = new Date().toISOString(),
): OnboardingResult {
  const profileRevision = 2;
  const needs: NeedIntentV1[] = profile.demand_tags.map((demand, index) => ({
    id: `need-onboarding-${personaId}-${demand.tagId}-${index}`,
    owner: { kind: "person", id: personaId },
    tag_ids: [demand.tagId],
    detail_quote: demand.detail_quote,
    ...(demand.safe_match?.approved && demand.safe_match.text.trim().length > 0
      ? { safe_match_text: demand.safe_match.text.trim() }
      : {}),
    safe_match_status: "draft",
    priority: demand.priority ? "primary" : "normal",
    urgency: profile.hot_lead?.flag ? "time_sensitive" : "active",
    constraints: [],
    status: "active",
    source: "onboarding",
    profile_revision: profileRevision,
    created_at: createdAt,
  }));
  const offers: CapabilityOfferV1[] = profile.supply_tags.map(
    (supply, index) => ({
      id: `offer-onboarding-${personaId}-${supply.tagId}-${index}`,
      owner: { kind: "person", id: personaId },
      tag_ids: [supply.tagId],
      detail: supply.detail,
      status: "active",
      source: "onboarding",
      profile_revision: profileRevision,
      created_at: createdAt,
    }),
  );
  return {
    snapshot: profile,
    needs,
    offers,
    consents: {
      publish: profile.consents.publish_profile,
      matching: profile.consents.use_private_needs_for_matching,
      quote: profile.consents.quote_in_intro,
    },
  };
}

export function applySafeTextConfirmations(
  result: OnboardingResult,
  confirmations: SafeTextConfirmation[],
): OnboardingResult {
  const byNeedId = new Map(
    confirmations.map((confirmation) => [confirmation.needId, confirmation]),
  );
  return {
    ...result,
    needs: result.needs.map((need) => {
      const confirmation = byNeedId.get(need.id);
      return confirmation
        ? {
            ...need,
            safe_match_text: confirmation.text,
            safe_match_status: "user_confirmed",
            safe_match_receipt: confirmation.receipt,
          }
        : need;
    }),
  };
}
