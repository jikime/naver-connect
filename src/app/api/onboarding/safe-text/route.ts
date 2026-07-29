// POST /api/onboarding/safe-text — safe_match_text 승인 영수증의 유일한 발급 경계(M2 P1-1).
// 클라이언트는 승인 의사(needId+문구)만 보내고, 서버(confirmSafeMatchTexts)가 owner·매칭 동의를
// 확인해 영수증을 발급한다. silent fallback 금지 — 검증 실패는 4xx/5xx로 그대로 드러낸다.
// mock auth 전제: personaId/session은 클라이언트 신고값(C3 문서화된 경계) — M4에서 실인증 교체.
// 근거: codex m2-onboarding-scope-reply #1

import { NextResponse } from "next/server";
import type { SafeTextConfirmRequest } from "@/lib/server/matching-service";
import { confirmSafeMatchTexts } from "@/lib/server/matching-service";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const req = body as Partial<SafeTextConfirmRequest>;
  if (
    typeof req.personaId !== "string" ||
    req.personaId.length === 0 ||
    !Array.isArray(req.approvals) ||
    req.approvals.some(
      (a) => typeof a?.needId !== "string" || typeof a?.text !== "string",
    ) ||
    typeof req.session !== "object" ||
    req.session === null
  ) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  try {
    const results = confirmSafeMatchTexts(req as SafeTextConfirmRequest);
    return NextResponse.json({ results });
  } catch (err) {
    // 검증 실패(동의 없음·타인 need 등)는 클라이언트 잘못 — 400으로 명시.
    const message = err instanceof Error ? err.message : "승인 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
