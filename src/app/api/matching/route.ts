// POST /api/matching — 매칭 서비스의 유일한 HTTP 경계(C3).
// private 원본은 서버(matching-service)에서만 읽히고, 클라이언트는 MatchingBundle 최소 DTO만 받는다.
// 사용자 식별자와 역할은 Auth.js 세션에서만 가져오며 클라이언트 신고값을 신뢰하지 않는다.
// 근거: codex final-rereview-reject #1, research_synthesis.md §13(DATA_SOURCE 명시·silent fallback 금지)

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { matchingSessionFromDatabase } from "@/lib/server/matching-runtime";
import {
  computeMatchingBundle,
  loadMatchingDataFromDatabase,
} from "@/lib/server/matching-service";
import {
  getAllOnboardingResults,
  getRuntimeStateForUser,
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
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const req = body as { personaId?: unknown };
  const personaId =
    authSession.user.role === "운영자" &&
    typeof req.personaId === "string" &&
    req.personaId.length > 0
      ? req.personaId
      : authSession.user.personaId;
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
  const bundle = computeMatchingBundle({
    personaId,
    role: authSession.user.role,
    session,
  });
  return NextResponse.json(bundle);
}
