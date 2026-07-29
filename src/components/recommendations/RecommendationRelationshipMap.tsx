"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MaskedMember, MatchScore, Recommendation } from "@/types";

interface Props {
  viewerId: string;
  recommendations: Recommendation[];
  members: MaskedMember[];
  scoresByPair: Map<string, MatchScore>;
}

const WIDTH = 960;
const HEIGHT = 390;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;

export function RecommendationRelationshipMap({
  viewerId,
  recommendations,
  members,
  scoresByPair,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const peers = useMemo(() => {
    const unique = new Map<string, Recommendation>();
    for (const rec of recommendations) {
      const otherId =
        rec.to_member_id === viewerId
          ? rec.from_member_id
          : (rec.to_member_id ?? rec.from_member_id);
      if (otherId !== viewerId && !unique.has(otherId)) {
        unique.set(otherId, rec);
      }
    }
    const entries = [...unique.entries()].slice(0, 10);
    return entries.map(([id, recommendation], index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / entries.length;
      const member = memberById.get(id);
      return {
        id,
        name: member?.name ?? id,
        org: member?.org.name ?? "",
        x: CX + Math.cos(angle) * (entries.length <= 4 ? 270 : 355),
        y: CY + Math.sin(angle) * (entries.length <= 4 ? 125 : 145),
        recommendation,
        score: scoresByPair.get(
          `${recommendation.from_member_id}→${recommendation.to_member_id ?? ""}`,
        )?.score,
      };
    });
  }, [memberById, recommendations, scoresByPair, viewerId]);
  const selected = peers.find((node) => node.id === selectedId) ?? peers[0];

  if (peers.length === 0) return null;

  return (
    <section
      aria-labelledby="weekly-relationship-map-title"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2
            id="weekly-relationship-map-title"
            className="font-heading text-xl font-light tracking-tight text-foreground"
          >
            이번 주 추천 관계망
          </h2>
          <p className="text-sm text-guud-text-muted-2">
            아래 카드와 같은 추천 결과예요. 선의 길이는 유사도 거리가 아니라
            읽기 쉬운 배치입니다.
          </p>
        </div>
        {selected && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/recommendations/${selected.recommendation.id}`}>
              {selected.name} 연결 보기
            </Link>
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-guud-hairline bg-card">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block min-h-80 w-full"
          role="img"
          aria-label={`나를 중심으로 한 이번 주 추천 ${peers.length}명 관계망`}
        >
          <title>이번 주 사람 추천 관계망</title>
          <desc>
            중앙의 나와 추천된 회원을 공통점 또는 차이점 연결선으로 표시합니다.
          </desc>
          {peers.map((node) => {
            const isDifferent = node.recommendation.rec_axis === "차이점";
            const active = node.id === selected?.id;
            return (
              <g key={`edge-${node.id}`}>
                <line
                  x1={CX}
                  y1={CY}
                  x2={node.x}
                  y2={node.y}
                  className={
                    active
                      ? "stroke-primary"
                      : isDifferent
                        ? "stroke-chart-4/65"
                        : "stroke-border"
                  }
                  strokeWidth={active ? 3 : 2}
                  strokeDasharray={isDifferent ? "7 6" : undefined}
                />
                {node.score !== undefined && (
                  <g
                    transform={`translate(${(CX + node.x) / 2} ${(CY + node.y) / 2})`}
                  >
                    <rect
                      x="-19"
                      y="-12"
                      width="38"
                      height="24"
                      rx="12"
                      className="fill-background stroke-border"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-foreground text-[12px] font-semibold"
                    >
                      {node.score}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          <circle
            cx={CX}
            cy={CY}
            r="49"
            className="fill-foreground stroke-foreground"
            strokeWidth="2"
          />
          <text
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-primary-foreground text-[15px] font-semibold"
          >
            나
          </text>

          {peers.map((node) => {
            const active = node.id === selected?.id;
            return (
              <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
                <circle
                  r={active ? 42 : 38}
                  className={
                    active
                      ? "fill-primary stroke-primary"
                      : "fill-card stroke-border"
                  }
                  strokeWidth="2"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={
                    active
                      ? "fill-primary-foreground text-[14px] font-semibold"
                      : "fill-foreground text-[14px] font-semibold"
                  }
                >
                  {node.name}
                </text>
                <text
                  y="57"
                  textAnchor="middle"
                  className="fill-muted-foreground text-[12px]"
                >
                  {node.recommendation.rec_axis}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        {peers.map((node) => (
          <Button
            key={node.id}
            type="button"
            variant={node.id === selected?.id ? "secondary" : "ghost"}
            size="xs"
            aria-pressed={node.id === selected?.id}
            onClick={() => setSelectedId(node.id)}
          >
            {node.name}
          </Button>
        ))}
      </div>

      {selected && (
        <p className="text-sm text-guud-text-muted-2" aria-live="polite">
          <span className="font-semibold text-foreground">{selected.name}</span>
          {selected.org ? ` · ${selected.org}` : ""} —{" "}
          {selected.recommendation.matching_rationale}
        </p>
      )}
    </section>
  );
}
