// CoverageSummary — 커버리지 통계(잠재/실제/rate) + 완전 공백 축 하이라이트(FR-GR-03).
// 근거: ARCHITECTURE.md §3(L2 GapReport), TASKS.md T-017
// 레드는 강조 전용(guud Do's/Don'ts) — 공백 축 콜아웃 테두리에만 destructive를 쓴다.

import type { Region } from "@/types";

export function CoverageSummary({ region }: { region: Region }) {
  const { potential, actual, rate } = region.coverage;

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
      <div className="border border-guud-hairline p-4">
        <p className="text-xs font-semibold text-guud-text-muted-2">
          연결 커버리지
        </p>
        <p className="mt-1 font-heading text-3xl font-bold text-foreground">
          {rate}%
        </p>
        <p className="mt-1 text-xs text-guud-text-muted-2">
          잠재 {potential}개 중 실제 {actual}개
        </p>
        <div
          role="img"
          aria-label={`잠재 ${potential}개 중 실제 ${actual}개, 커버리지 ${rate}퍼센트`}
          className="mt-3 h-2 w-full overflow-hidden bg-muted"
        >
          <div
            className="h-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
          />
        </div>
      </div>

      <div className="border border-destructive/40 bg-destructive/5 p-4">
        <p className="text-xs font-semibold text-destructive">완전 공백 축</p>
        <p className="mt-1 font-heading text-xl font-bold text-foreground">
          {region.highlighted_gap_axis}
        </p>
        <p className="mt-1 text-xs text-guud-text-muted-2">
          잠재 연결이 있으나 실제 연결이 0건인 축입니다. 아래 연결맵과 기회 카드
          G1에서 상세를 확인하세요.
        </p>
      </div>
    </div>
  );
}
