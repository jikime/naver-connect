// POST /api/onboarding/safe-text — safe_match_text 승인 영수증의 유일한 발급 경계(M2 P1-1).
// 클라이언트는 승인 의사(needId+문구)만 보내고, 서버(confirmSafeMatchTexts)가 owner·매칭 동의를
// 확인해 영수증을 발급한다. silent fallback 금지 — 검증 실패는 4xx/5xx로 그대로 드러낸다.
// personaId는 Auth.js 세션에서 가져오며 클라이언트 신고값을 신뢰하지 않는다.
// 근거: codex m2-onboarding-scope-reply #1

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { applySafeTextConfirmations } from "@/lib/onboarding/result";
import { matchingSessionFromDatabase } from "@/lib/server/matching-runtime";
import type { SafeTextConfirmRequest } from "@/lib/server/matching-service";
import {
  confirmSafeMatchTexts,
  loadMatchingDataFromDatabase,
} from "@/lib/server/matching-service";
import {
  getAllOnboardingResults,
  getRuntimeStateForUser,
  mergeRuntimeStateForUser,
} from "@/lib/server/runtime-state-repository";

export async function POST(request: Request): Promise<NextResponse> {
  const authSession = await auth();
  if (!authSession?.user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const req = body as Partial<SafeTextConfirmRequest>;
  if (
    !Array.isArray(req.approvals) ||
    req.approvals.some(
      (a) => typeof a?.needId !== "string" || typeof a?.text !== "string",
    )
  ) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  try {
    const [runtimeState, onboardingResults] = await Promise.all([
      getRuntimeStateForUser(authSession.user.id),
      getAllOnboardingResults(),
      loadMatchingDataFromDatabase(),
    ]);
    const session = matchingSessionFromDatabase(
      runtimeState.state,
      onboardingResults,
      authSession.user.role,
    );
    const results = confirmSafeMatchTexts({
      personaId: authSession.user.personaId,
      approvals: req.approvals,
      session,
    });
    const current = onboardingResults[authSession.user.personaId];
    if (!current) throw new Error("승인할 온보딩 결과가 없습니다");
    const upgraded = applySafeTextConfirmations(current, results);
    await mergeRuntimeStateForUser(authSession.user.id, {
      onboardingResults: {
        ...((runtimeState.state.onboardingResults as Record<string, unknown>) ??
          {}),
        [authSession.user.personaId]: upgraded,
      },
    });
    return NextResponse.json({ results });
  } catch (err) {
    // 검증 실패(동의 없음·타인 need 등)는 클라이언트 잘못 — 400으로 명시.
    const message = err instanceof Error ? err.message : "승인 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
