// PhaseBanner — "미래 자동화 버전 UI 프리뷰" 위상 고지. 전 화면 상존(R-01, PRD §1).
// 근거: ARCHITECTURE.md §3(L3), TASKS.md T-007
// 정적 텍스트라 인터랙션이 없다 — Server Component로 유지(ADR-04).

export function PhaseBanner() {
  return (
    <div
      role="note"
      className="border-b border-guud-hairline bg-muted px-[30px] py-1.5 text-center text-xs text-guud-text-muted-2"
    >
      이 화면은{" "}
      <strong className="font-semibold text-foreground">
        미래 자동화 버전 UI 프리뷰
      </strong>
      입니다. 실제 매칭·검수·데이터 연동은 시뮬레이션이며, 백엔드·인증·실 LLM
      호출은 포함되지 않습니다.
    </div>
  );
}
