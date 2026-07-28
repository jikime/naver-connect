"use client";

// CollabPatternPanel — 하위그룹 협업 패턴 빈도 분석 패널 (v1.2).
// pair_code(예: "A5 × A4") 별 협력 건수·평균 강도·관계 유형을 표 형태로 표시.
// 근거: ARCHITECTURE.md §5.3, FR-CS-02 (v1.2 패턴 분석 확장).

import { useEffect, useState } from "react";
import {
  getCollabPatterns,
  getSubgroupLayerLetter,
  SUBGROUP_KIND_COLOR,
  SUBGROUP_KIND_LABEL,
} from "@/lib/dal/collaboration";
import { useViewerContext } from "@/stores/viewer-context";
import type { SubgroupCode } from "@/types";

// 색상/라벨은 src/lib/dal/collaboration.ts의 단일 소스를 공유한다(A/B/C 레터 키).
const KIND_COLOR = SUBGROUP_KIND_COLOR;
const KIND_LABEL = SUBGROUP_KIND_LABEL;

const KIND_BG: Record<string, string> = {
  C: "#eef0f2",
  B: "#fbf1e3",
  A: "#e6f1f4",
};

function subgroupBadge(code: SubgroupCode) {
  const layer = getSubgroupLayerLetter(code);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{
        background: KIND_BG[layer] ?? "#eef0f2",
        color: KIND_COLOR[layer] ?? "#6b7686",
      }}
    >
      {code}
    </span>
  );
}

function strengthBar(avg: number) {
  const pct = Math.round(avg * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-guud-hairline">
        <div
          className="h-full rounded-full bg-teal-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-guud-text-muted-2">
        {avg.toFixed(2)}
      </span>
    </div>
  );
}

type PatternRow = Awaited<ReturnType<typeof getCollabPatterns>>[number];

export function CollabPatternPanel({
  onlyActual = true,
}: {
  onlyActual?: boolean;
}) {
  const vc = useViewerContext();
  const [patterns, setPatterns] = useState<PatternRow[]>([]);
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: vc.personaId만 추적
  useEffect(() => {
    let cancelled = false;
    getCollabPatterns(vc, onlyActual).then((rows) => {
      if (!cancelled) {
        setPatterns(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vc.personaId, onlyActual]);

  if (loading) {
    return <p className="text-sm text-guud-text-muted-2">분석 중…</p>;
  }

  if (patterns.length === 0) {
    return (
      <p className="text-sm text-guud-text-muted-2">
        분석할 협업 패턴이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-guud-hairline">
            <th className="py-2 pr-3 text-left font-semibold text-guud-text-muted-2">
              하위그룹 쌍
            </th>
            <th className="px-3 py-2 text-center font-semibold text-guud-text-muted-2">
              협력 건수
            </th>
            <th className="px-3 py-2 text-left font-semibold text-guud-text-muted-2">
              평균 강도
            </th>
            <th className="pl-3 py-2 text-left font-semibold text-guud-text-muted-2">
              관계 유형
            </th>
          </tr>
        </thead>
        <tbody>
          {patterns.map((row) => (
            <tr
              key={row.pair_code}
              className="border-b border-guud-hairline last:border-0 hover:bg-guud-hairline/40 transition-colors"
            >
              <td className="py-2 pr-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {subgroupBadge(row.org_a_subgroup)}
                  <span className="text-guud-text-muted-2">×</span>
                  {subgroupBadge(row.org_b_subgroup)}
                  <span className="ml-1 text-[10px] text-guud-text-muted-2">
                    {getSubgroupLayerLetter(row.org_a_subgroup) ===
                    getSubgroupLayerLetter(row.org_b_subgroup)
                      ? "동층"
                      : "이층"}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2 text-center">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
                  {row.count}
                </span>
              </td>
              <td className="px-3 py-2">{strengthBar(row.avg_strength)}</td>
              <td className="pl-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {row.relation_types.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-guud-hairline px-2 py-0.5 text-[10px] text-guud-text-muted-2"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 층 범례 */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {(["A", "B", "C"] as const).map((layer) => (
          <span
            key={layer}
            className="flex items-center gap-1.5 text-[11px] text-guud-text-muted-2"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: KIND_COLOR[layer] }}
            />
            {layer} = {KIND_LABEL[layer]}
          </span>
        ))}
      </div>
    </div>
  );
}
