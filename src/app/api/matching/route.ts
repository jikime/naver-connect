// POST /api/matching — 매칭 서비스의 유일한 HTTP 경계(C3).
// private 원본은 서버(matching-service)에서만 읽히고, 클라이언트는 MatchingBundle 최소 DTO만 받는다.
// mock auth 전제: personaId/role/session은 클라이언트 신고값(역할 스위처 데모 구조) — M4에서 실인증 교체.
// 근거: codex final-rereview-reject #1, research_synthesis.md §13(DATA_SOURCE 명시·silent fallback 금지)

import { NextResponse } from "next/server";
import type { MatchingRequest } from "@/lib/server/matching-service";
import { computeMatchingBundle } from "@/lib/server/matching-service";

const ROLES = new Set(["기업가", "전문가", "운영자"]);

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const req = body as Partial<MatchingRequest>;
  if (
    typeof req.personaId !== "string" ||
    req.personaId.length === 0 ||
    typeof req.role !== "string" ||
    !ROLES.has(req.role) ||
    typeof req.session !== "object" ||
    req.session === null
  ) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const session = {
    onboardingResults: req.session.onboardingResults ?? {},
    recommendationOverrides: req.session.recommendationOverrides ?? {},
    ruleWeightOverrides: req.session.ruleWeightOverrides ?? null,
  };
  // 오류를 조용히 숨기지 않는다(fail-closed) — 서비스 예외는 500으로 그대로 드러낸다.
  const bundle = computeMatchingBundle({
    personaId: req.personaId,
    role: req.role as MatchingRequest["role"],
    session,
  });
  return NextResponse.json(bundle);
}
