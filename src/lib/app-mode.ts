// APP_MODE — 시드 목업 동의(seed_mock)를 신뢰할지 결정하는 명시적 스위치.
// demo가 아니면 seed_mock 동의는 무효(fail-closed) → 시드 회원은 매칭·원문 인용에서 제외된다.
// 실행: `npm run dev:demo` 또는 NEXT_PUBLIC_APP_MODE=demo. 테스트는 vitest.config env로 demo 설정.
// 근거: Codex 리뷰 P1-2(codex-m0m1-review-changes-requested) — "demo seed 허용은 명시적 APP_MODE=demo에서만"

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_MODE === "demo";
}
