// MapNodeMarker — 연결맵·지역 맵 두 뷰가 공유하는 노드 마커(ADR-02 패턴 재사용).
// 근거: TASKS.md T-018·T-020(격차 리포트 지역 맵 뷰) — 좌표만 다르고 시각 언어는 동일해야
// 토글해도 "같은 데이터의 다른 배치"임이 자연스럽게 읽힌다.
// 포커서블 <g role="button" tabIndex>, 형태 이중성(각진 rect + 선택 시 원형 pill).
// hasMemberOrg: 팀리드 T-020 추가 지시 "회원 기관은 링 강조" — 색이 아니라 이중
// 테두리(오프셋 링 프레임) 모양으로 표시해 NFR-05 색맹 대응을 지킨다.

import { cn } from "@/lib/utils";

const NODE_WIDTH = 132;
const NODE_HEIGHT = 52;
const RING_INSET = 5;

export function MapNodeMarker({
  label,
  count,
  x,
  y,
  isSelected,
  isAxisHighlight,
  hasMemberOrg = false,
  onSelect,
}: {
  label: string;
  count?: number;
  x: number;
  y: number;
  isSelected: boolean;
  isAxisHighlight: boolean;
  hasMemberOrg?: boolean;
  onSelect: () => void;
}) {
  const left = x - NODE_WIDTH / 2;
  const top = y - NODE_HEIGHT / 2;

  return (
    // biome-ignore lint/a11y/useSemanticElements: SVG 노드는 <button>으로 대체 불가 — ADR-02 포커서블 <g role="button"> 결정
    <g
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${label}${count !== undefined ? `, 규모 ${count}` : ""}${hasMemberOrg ? ", 네트워크 회원 조직 포함" : ""}. 선택하면 주체 상세를 봅니다.`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className="group cursor-pointer outline-none"
    >
      <title>{label}</title>
      {/* 회원 기관 링 강조 — 색이 아니라 이중 테두리 "링" 모양으로 구분(NFR-05) */}
      {hasMemberOrg && (
        <rect
          x={left - RING_INSET}
          y={top - RING_INSET}
          width={NODE_WIDTH + RING_INSET * 2}
          height={NODE_HEIGHT + RING_INSET * 2}
          rx={0}
          className="fill-none stroke-foreground/70"
          strokeWidth={1.5}
        />
      )}
      <rect
        x={left}
        y={top}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={0}
        className={cn(
          "fill-card transition-colors group-hover:fill-muted",
          isSelected
            ? "stroke-ring"
            : isAxisHighlight
              ? "stroke-destructive"
              : "stroke-border",
        )}
        strokeWidth={isSelected ? 3 : isAxisHighlight ? 2 : 1}
        strokeDasharray={!isSelected && isAxisHighlight ? "4 3" : undefined}
      />
      <text
        x={x}
        y={y - 4}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        {label}
      </text>
      {count !== undefined && (
        <text
          x={x}
          y={y + 15}
          textAnchor="middle"
          className="fill-guud-text-muted-2 text-[11px]"
        >
          규모 {count}
        </text>
      )}
      {/* 형태 이중성(guud): 카드형 노드는 각진 rect, 선택 표시는 원형 pill로 이중 형태 언어를 유지 */}
      {isSelected && (
        <circle
          cx={left + NODE_WIDTH - 8}
          cy={top + 8}
          r={5}
          className="fill-primary"
        />
      )}
    </g>
  );
}
