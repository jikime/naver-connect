import "server-only";

import type { UserRole } from "@/lib/auth/types";
import type { MatchingSessionState } from "@/lib/server/matching-service";
import type {
  OnboardingResult,
  RecommendationOverride,
} from "@/stores/session-interaction";
import type { RuleWeight } from "@/types";

function objectRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function matchingSessionFromDatabase(
  runtimeState: Record<string, unknown>,
  onboardingResults: Record<string, OnboardingResult>,
  role: UserRole,
): MatchingSessionState {
  const overrides = objectRecord(
    runtimeState.recommendationOverrides,
  ) as Record<string, RecommendationOverride>;
  const storedWeights = runtimeState.ruleWeightOverrides;
  return {
    onboardingResults,
    recommendationOverrides: overrides,
    ruleWeightOverrides:
      role === "운영자" && Array.isArray(storedWeights)
        ? (storedWeights as RuleWeight[])
        : null,
  };
}
