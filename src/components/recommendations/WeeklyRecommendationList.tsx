"use client";

// WeeklyRecommendationList — 주간 추천 개편(v1.1 FR-RC-01/02): 공통점 많은 회원 5명 + 차이점
// 많은 회원 5명을 구분 제시하고, 각 그룹을 "더 보기"로 최대 15명까지 확장한다. 공공중간지원
// 분기·모듬 변형은 기존대로 MeetupCard(meetup_id→meetups.json 참조, ADR-06 v1.1)로 렌더한다.
// 근거: ARCHITECTURE.md §3(L2 WeeklyRecommendationList·L3 MeetupCard), FR-RC-01/02/08.
// 그룹핑·정렬(핫리드+퍼즐형 우선)·15건 캡은 getRecommendations(DAL)가 이미 처리하므로
// 이 컴포넌트는 초기 5건/더보기 페이지네이션과 렌더만 담당한다.

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HotLeadBadge } from "@/components/shared/HotLeadBadge";
import { MatchTypeBadge } from "@/components/shared/MatchTypeBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMatchScores, getMeetups, getRecommendations } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import { useViewerContext } from "@/stores/viewer-context";
import type { MatchScore, Meetup, Recommendation } from "@/types";
import { MeetupCard } from "./MeetupCard";

const INITIAL_VISIBLE = 5;
const MAX_VISIBLE = 15;

function scoreKey(fromId: string, toId: string | null): string {
  return `${fromId}→${toId ?? ""}`;
}

// Task #21: 카드 리스트 스태거 진입(항목당 60ms 지연, 개별 트랜지션 120ms 이내)
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.12 } },
};

function RecommendationSummaryCard({
  rec,
  score,
}: {
  rec: Recommendation;
  score?: MatchScore;
}) {
  const reasonKeywords = score
    ? rec.rec_axis === "공통점"
      ? score.shared_keywords
      : score.complementary_keywords
    : [];
  return (
    <Link href={`/recommendations/${rec.id}`} className="block h-full">
      <Card
        className={cn(
          "h-full transition-colors hover:bg-muted/50",
          rec.is_hot_lead && "border-l-4 border-l-destructive",
        )}
      >
        <CardHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <MatchTypeBadge type={rec.match_type} />
            <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
              {rec.value_class}
            </Badge>
            {score && (
              <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
                매칭 점수 {score.score}
              </Badge>
            )}
            {rec.is_hot_lead && <HotLeadBadge />}
          </div>
          <CardTitle className="text-base normal-case tracking-normal">
            {rec.message.intro}
          </CardTitle>
          <CardDescription>{rec.message.first_action}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {reasonKeywords.length > 0 && (
            <p className="text-xs text-guud-text-muted-2">
              {rec.rec_axis === "공통점" ? "공통 사유" : "차이 사유"}:{" "}
              {reasonKeywords.join(", ")}
            </p>
          )}
          <span className="text-xs font-semibold text-foreground underline underline-offset-2">
            상세 보기 →
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

/** 추천 1건 렌더 — 모듬 변형(meetup_id)이면 MeetupCard, 아니면 1:1 요약 카드. */
function RecommendationCard({
  rec,
  meetupsById,
  scoresByPair,
}: {
  rec: Recommendation;
  meetupsById: Map<string, Meetup>;
  scoresByPair: Map<string, MatchScore>;
}) {
  if (rec.rec_kind === "모듬") {
    const meetup = rec.meetup_id ? meetupsById.get(rec.meetup_id) : undefined;
    if (!meetup) return null;
    return <MeetupCard meetup={meetup} introText={rec.message.intro} />;
  }
  const score = scoresByPair.get(
    scoreKey(rec.from_member_id, rec.to_member_id),
  );
  return <RecommendationSummaryCard rec={rec} score={score} />;
}

/** 공통점/차이점 한 그룹 — 초기 5건 + "더 보기"로 최대 15건까지 확장(FR-RC-01). */
function RecommendationGroup({
  title,
  description,
  recs,
  meetupsById,
  scoresByPair,
}: {
  title: string;
  description: string;
  recs: Recommendation[];
  meetupsById: Map<string, Meetup>;
  scoresByPair: Map<string, MatchScore>;
}) {
  const [expanded, setExpanded] = useState(false);
  if (recs.length === 0) {
    return null;
  }
  const capped = recs.slice(0, MAX_VISIBLE);
  const visible = expanded ? capped : capped.slice(0, INITIAL_VISIBLE);
  const hasMore = capped.length > visible.length;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          {title}{" "}
          <span className="text-guud-text-muted-2">{capped.length}명</span>
        </h2>
        <p className="text-xs text-guud-text-muted-2">{description}</p>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {visible.map((rec) => (
          <motion.div key={rec.id} variants={item}>
            <RecommendationCard
              rec={rec}
              meetupsById={meetupsById}
              scoresByPair={scoresByPair}
            />
          </motion.div>
        ))}
      </motion.div>
      {hasMore && (
        <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
          더 보기({capped.length - visible.length}명 더, 최대 {MAX_VISIBLE}명)
        </Button>
      )}
    </section>
  );
}

export function WeeklyRecommendationList() {
  const vc = useViewerContext();
  const overrides = useSessionInteractionStore(
    (state) => state.recommendationOverrides,
  );
  const [groups, setGroups] = useState<{
    common: Recommendation[];
    different: Recommendation[];
  } | null>(null);
  const [meetupsById, setMeetupsById] = useState<Map<string, Meetup>>(
    new Map(),
  );
  const [scoresByPair, setScoresByPair] = useState<Map<string, MatchScore>>(
    new Map(),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: overrides는 거절/후기/승인 세션 반영 시 재조회를 트리거하기 위한 의도적 의존성(본문 미참조).
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getRecommendations(vc),
      getMeetups(vc),
      getMatchScores(vc),
    ]).then(([result, meetups, matchScores]) => {
      if (!cancelled) {
        setGroups(result);
        setMeetupsById(new Map(meetups.map((m) => [m.id, m])));
        setScoresByPair(
          new Map(
            matchScores.scores.map((s) => [
              scoreKey(s.from_member_id, s.to_member_id),
              s,
            ]),
          ),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vc, overrides]);

  if (groups === null) {
    return (
      <p className="px-[30px] py-6 text-sm text-guud-text-muted-2">
        추천을 불러오는 중입니다…
      </p>
    );
  }

  if (groups.common.length === 0 && groups.different.length === 0) {
    return (
      <p className="px-[30px] py-6 text-sm text-guud-text-muted-2">
        이번 주 추천이 아직 없습니다. 온보딩을 완료하면 추천이 생성됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-8 px-[30px] py-6">
      <RecommendationGroup
        title="공통점이 많은 회원"
        description="거울형·선배형·취미형 등 나와 비슷한 축의 매칭입니다. 매칭 점수가 높은 순으로 보여드려요."
        recs={groups.common}
        meetupsById={meetupsById}
        scoresByPair={scoresByPair}
      />
      <RecommendationGroup
        title="차이점이 많은 회원"
        description="퍼즐형·다리형 등 서로를 보완하는 축의 매칭입니다. 핫리드는 퍼즐형이 먼저 오고, 그다음은 매칭 점수순이에요."
        recs={groups.different}
        meetupsById={meetupsById}
        scoresByPair={scoresByPair}
      />
    </div>
  );
}
