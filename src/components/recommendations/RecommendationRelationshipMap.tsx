"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import embeddingShadow from "@/data/people/derived/member-embedding-shadow.json";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  MaskedMember,
  MatchScore,
  MemberEmbeddingShadow,
  Recommendation,
} from "@/types";

interface Props {
  viewerId: string;
  recommendations: Recommendation[];
  members: MaskedMember[];
  scoresByPair: Map<string, MatchScore>;
}

interface MapNode {
  memberId: string;
  name: string;
  org: string;
  x: number;
  y: number;
  recommendation?: Recommendation;
  score?: number;
}

const WIDTH = 800;
const HEIGHT = 470;
const PADDING = 65;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const PROJECTION_SCALE =
  Math.min(WIDTH - PADDING * 2, HEIGHT - PADDING * 2) / 2;

function svgX(value: number): number {
  return CENTER_X + value * PROJECTION_SCALE;
}

function svgY(value: number): number {
  return CENTER_Y - value * PROJECTION_SCALE;
}

function otherMemberId(
  recommendation: Recommendation,
  viewerId: string,
): string | null {
  if (recommendation.rec_kind !== "1:1" || !recommendation.to_member_id) {
    return null;
  }
  if (recommendation.from_member_id === viewerId) {
    return recommendation.to_member_id;
  }
  if (recommendation.to_member_id === viewerId) {
    return recommendation.from_member_id;
  }
  return null;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("↔");
}

export function RecommendationRelationshipMap({
  viewerId,
  recommendations,
  members,
  scoresByPair,
}: Props) {
  const sessionShadow = useSessionInteractionStore(
    (state) => state.memberEmbeddingShadows[viewerId],
  );
  const activeShadow =
    sessionShadow ?? (embeddingShadow as MemberEmbeddingShadow);
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const recommendationByMember = useMemo(() => {
    const result = new Map<string, Recommendation>();
    for (const recommendation of recommendations) {
      const memberId = otherMemberId(recommendation, viewerId);
      if (memberId && !result.has(memberId)) {
        result.set(memberId, recommendation);
      }
    }
    return result;
  }, [recommendations, viewerId]);
  const cosineByPair = useMemo(
    () =>
      new Map(
        activeShadow.pairs.map((pair) => [
          pairKey(pair.a, pair.b),
          pair.cosine,
        ]),
      ),
    [activeShadow],
  );
  const nodes = useMemo<MapNode[]>(
    () =>
      activeShadow.nodes.map((embedded) => {
        const member = memberById.get(embedded.member_id);
        const recommendation = recommendationByMember.get(embedded.member_id);
        return {
          memberId: embedded.member_id,
          name: member?.name ?? embedded.member_id,
          org: member?.org.name ?? "",
          x: svgX(embedded.x),
          y: svgY(embedded.y),
          recommendation,
          score: recommendation
            ? scoresByPair.get(
                `${recommendation.from_member_id}→${recommendation.to_member_id ?? ""}`,
              )?.score
            : undefined,
        };
      }),
    [activeShadow, memberById, recommendationByMember, scoresByPair],
  );
  const viewer = nodes.find((node) => node.memberId === viewerId);
  const recommendedNodes = nodes.filter((node) => node.recommendation);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    recommendedNodes.find((node) => node.memberId === selectedId) ??
    recommendedNodes[0];

  if (!viewer || recommendedNodes.length === 0) return null;

  const selectedCosine = selected
    ? cosineByPair.get(pairKey(viewerId, selected.memberId))
    : undefined;

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
            이번 주 추천 지도
          </h2>
          <p className="text-sm text-guud-text-muted-2">
            점 위치는 공개 자기소개를 KURE-v1로 임베딩한 의미 공간이고, 선은
            이번 주 실제 추천입니다.
          </p>
          {sessionShadow && (
            <p className="text-xs font-semibold text-foreground">
              온보딩에서 확정한 공개 프로필 위치가 반영됐습니다.
            </p>
          )}
        </div>
        {selected?.recommendation && (
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
          aria-label={`회원 공개 프로필 임베딩 공간 위에 표시한 이번 주 추천 ${recommendedNodes.length}명`}
        >
          <title>회원 임베딩 공간과 이번 주 추천</title>
          <desc>
            여덟 회원의 공개 프로필을 KURE-v1로 임베딩한 이차원 위치 위에 현재
            회원에게 생성된 실제 추천 연결만 표시합니다.
          </desc>

          {recommendedNodes.map((node) => {
            const recommendation = node.recommendation;
            if (!recommendation) return null;
            const active = node.memberId === selected?.memberId;
            const isDifferent = recommendation.rec_axis === "차이점";
            return (
              <line
                key={`edge-${node.memberId}`}
                x1={viewer.x}
                y1={viewer.y}
                x2={node.x}
                y2={node.y}
                className={
                  active
                    ? "stroke-primary"
                    : isDifferent
                      ? "stroke-chart-4/45"
                      : "stroke-border"
                }
                strokeWidth={active ? 3 : 1.5}
                strokeDasharray={isDifferent ? "7 6" : undefined}
              />
            );
          })}

          {nodes.map((node) => {
            const isViewer = node.memberId === viewerId;
            const isRecommended = Boolean(node.recommendation);
            const active = node.memberId === selected?.memberId;
            const nodeContents = (
              <>
                <circle
                  r={isViewer ? 33 : active ? 28 : isRecommended ? 23 : 17}
                  className={
                    isViewer
                      ? "fill-foreground stroke-foreground"
                      : active
                        ? "fill-primary stroke-primary"
                        : isRecommended
                          ? "fill-card stroke-foreground"
                          : "fill-muted stroke-border"
                  }
                  strokeWidth={isRecommended || isViewer ? 2 : 1}
                />
                <text
                  y={isViewer ? 5 : isRecommended ? 4 : 3}
                  textAnchor="middle"
                  className={
                    isViewer || active
                      ? "fill-primary-foreground text-[13px] font-semibold"
                      : isRecommended
                        ? "fill-foreground text-[12px] font-semibold"
                        : "fill-muted-foreground text-[10px]"
                  }
                >
                  {isViewer ? "나" : node.name}
                </text>
                {isViewer && (
                  <text
                    y="52"
                    textAnchor="middle"
                    className="fill-foreground text-[12px] font-semibold"
                  >
                    {node.name}
                  </text>
                )}
                {isRecommended && !isViewer && (
                  <text
                    y="43"
                    textAnchor="middle"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {node.recommendation?.rec_axis}
                  </text>
                )}
              </>
            );

            return (
              <g
                key={node.memberId}
                transform={`translate(${node.x} ${node.y})`}
                opacity={isViewer || isRecommended ? 1 : 0.38}
              >
                {node.recommendation ? (
                  <a
                    href={`/recommendations/${node.recommendation.id}`}
                    aria-label={`${node.name} 추천 상세 보기`}
                    onMouseEnter={() => setSelectedId(node.memberId)}
                    onFocus={() => setSelectedId(node.memberId)}
                  >
                    {nodeContents}
                  </a>
                ) : (
                  nodeContents
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-guud-text-muted-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-px w-6 bg-border" aria-hidden="true" />
          공통점 추천
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-6 border-t border-dashed border-chart-4"
            aria-hidden="true"
          />
          차이점 추천
        </span>
        <span>옅은 점 · 이번 주 추천에 포함되지 않은 회원</span>
      </div>

      {selected?.recommendation && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-guud-hairline pt-4">
          <p className="max-w-3xl text-sm leading-relaxed text-guud-text-muted-2">
            <span className="font-semibold text-foreground">
              {selected.name}
            </span>
            {selected.org ? ` · ${selected.org}` : ""}
            {selectedCosine !== undefined
              ? ` · KURE 원본 1024차원 cosine ${selectedCosine.toFixed(3)}`
              : ""}
            {selected.score !== undefined
              ? ` · 추천 엔진 점수 ${selected.score}`
              : ""}
            <br />
            {selected.recommendation.matching_rationale}
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-guud-text-muted-2">
        2차원 점 사이 거리는 공개 프로필 표현의 대략적인 배치이며 추천 순위·관계
        강도와 같지 않습니다. 추천선과 상세 설명은 기존 매칭 엔진 결과를 그대로
        사용합니다.
      </p>
    </section>
  );
}
