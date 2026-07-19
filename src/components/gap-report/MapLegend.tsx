// MapLegend — 연결맵·지역 맵 공용 범례. 색+패턴+텍스트 삼중 부호화(NFR-05).
// 근거: ARCHITECTURE.md NFR-05·§18, TASKS.md T-018·T-020

export function MapLegend({
  highlightedAxisLabel,
}: {
  highlightedAxisLabel: string;
}) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-guud-hairline pt-2 text-xs text-guud-text-muted-2">
      <li className="flex items-center gap-1.5">
        <svg width="20" height="8" aria-hidden="true">
          <line
            x1="0"
            y1="4"
            x2="20"
            y2="4"
            strokeWidth={2}
            className="stroke-foreground"
          />
        </svg>
        실제 연결
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="20" height="8" aria-hidden="true">
          <line
            x1="0"
            y1="4"
            x2="20"
            y2="4"
            strokeWidth={2}
            strokeDasharray="4 3"
            className="stroke-guud-text-muted-2"
          />
        </svg>
        잠재 연결(공백)
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="20" height="8" aria-hidden="true">
          <line
            x1="0"
            y1="4"
            x2="20"
            y2="4"
            strokeWidth={3}
            strokeDasharray="4 3"
            className="stroke-destructive"
          />
        </svg>
        완전 공백 축({highlightedAxisLabel})
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="18" height="14" aria-hidden="true">
          <rect
            x="1"
            y="1"
            width="16"
            height="12"
            className="fill-none stroke-foreground/50"
            strokeWidth={1}
          />
          <rect
            x="4"
            y="4"
            width="10"
            height="6"
            className="fill-card stroke-border"
          />
        </svg>
        네트워크 회원 조직 포함(이중 테두리)
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="54" height="8" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <circle
              // biome-ignore lint/suspicious/noArrayIndexKey: 5개 고정 눈금, 순서 불변
              key={i}
              cx={4 + i * 12}
              cy={4}
              r={3}
              className={i < 3 ? "fill-primary" : "fill-none stroke-border"}
            />
          ))}
        </svg>
        buying power(구매력) 5단계
      </li>
    </ul>
  );
}
