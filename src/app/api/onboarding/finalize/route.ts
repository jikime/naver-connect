import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  applySafeTextConfirmations,
  buildOnboardingResult,
} from "@/lib/onboarding/result";
import { onboardingFinalizeSchema } from "@/lib/onboarding/validation";
import { matchingSessionFromDatabase } from "@/lib/server/matching-runtime";
import {
  computeMatchingBundle,
  confirmSafeMatchTexts,
  loadMatchingDataFromDatabase,
} from "@/lib/server/matching-service";
import { completeOnboarding } from "@/lib/server/profile-repository";
import {
  getAllOnboardingResults,
  getRuntimeStateForUser,
  mergeRuntimeStateForUser,
} from "@/lib/server/runtime-state-repository";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }
  if (session.user.role === "운영자") {
    return NextResponse.json(
      { error: "회원만 온보딩할 수 있습니다." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식을 확인해주세요." },
      { status: 400 },
    );
  }
  const parsed = onboardingFinalizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "온보딩 입력값을 확인해주세요.",
      },
      { status: 400 },
    );
  }

  try {
    const member = await completeOnboarding(
      session.user.id,
      session.user.role,
      parsed.data,
    );
    const [runtimeState, storedOnboardingResults] = await Promise.all([
      getRuntimeStateForUser(session.user.id),
      getAllOnboardingResults(),
      loadMatchingDataFromDatabase(true),
    ]);
    let result = buildOnboardingResult(session.user.personaId, parsed.data);
    let onboardingResults = {
      ...storedOnboardingResults,
      [session.user.personaId]: result,
    };
    let matchingSession = matchingSessionFromDatabase(
      runtimeState.state,
      onboardingResults,
      session.user.role,
    );
    const approvals = result.needs
      .filter((need) => typeof need.safe_match_text === "string")
      .map((need) => ({
        needId: need.id,
        text: need.safe_match_text as string,
      }));
    if (
      parsed.data.consents.use_private_needs_for_matching &&
      approvals.length > 0
    ) {
      const confirmations = confirmSafeMatchTexts({
        personaId: session.user.personaId,
        approvals,
        session: matchingSession,
      });
      result = applySafeTextConfirmations(result, confirmations);
      onboardingResults = {
        ...onboardingResults,
        [session.user.personaId]: result,
      };
      matchingSession = matchingSessionFromDatabase(
        runtimeState.state,
        onboardingResults,
        session.user.role,
      );
    }
    const ownStoredResults =
      runtimeState.state.onboardingResults !== null &&
      typeof runtimeState.state.onboardingResults === "object" &&
      !Array.isArray(runtimeState.state.onboardingResults)
        ? (runtimeState.state.onboardingResults as Record<string, unknown>)
        : {};
    await mergeRuntimeStateForUser(session.user.id, {
      onboardingResults: {
        ...ownStoredResults,
        [session.user.personaId]: result,
      },
      onboardingFinalized: {
        [session.user.personaId]: true,
      },
    });
    const bundle = computeMatchingBundle({
      personaId: session.user.personaId,
      role: session.user.role,
      session: matchingSession,
    });
    return NextResponse.json({
      member,
      firstRecommendations: bundle.engineRecommendations.filter(
        (recommendation) => recommendation.status === "pending_review",
      ),
    });
  } catch (error) {
    console.error("온보딩 저장 실패", error);
    return NextResponse.json(
      {
        error: "온보딩 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 },
    );
  }
}
