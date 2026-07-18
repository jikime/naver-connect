"use client";

// WeeklyRecommendationList — 주간 추천 3장·유형 혼합·핫리드 퍼즐형 우선·공공중간지원 분기 렌더.
// 근거: ARCHITECTURE.md §3(L2 WeeklyRecommendationList·L3 MeetupCard), TASKS.md T-012,
//       FR-RC-01/02/08. 1:1 차단·유형 필터는 getRecommendations(T-003)가 이미 처리하므로
//       이 컴포넌트는 정렬(핫리드+퍼즐형 우선)과 렌더만 담당한다(T-012 Self-check).

import Link from "next/link";
import { useEffect, useState } from "react";
import { HotLeadBadge } from "@/components/shared/HotLeadBadge";
import { MatchTypeBadge } from "@/components/shared/MatchTypeBadge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRecommendations } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import { useViewerContext } from "@/stores/viewer-context";
import type { Recommendation } from "@/types";
import { MeetupCard } from "./MeetupCard";

/** 핫리드·퍼즐형을 앞으로 정렬한다(FR-RC-02). DAL 필터링 결과의 표시 순서만 바꾼다. */
function sortByHotLeadPuzzleFirst(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort((a, b) => {
    const aPriority = a.is_hot_lead && a.match_type === "퍼즐형" ? 0 : 1;
    const bPriority = b.is_hot_lead && b.match_type === "퍼즐형" ? 0 : 1;
    return aPriority - bPriority;
  });
}

function RecommendationSummaryCard({ rec }: { rec: Recommendation }) {
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
            {rec.is_hot_lead && <HotLeadBadge />}
          </div>
          <CardTitle className="text-base normal-case tracking-normal">
            {rec.message.intro}
          </CardTitle>
          <CardDescription>{rec.message.first_action}</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="text-xs font-semibold text-foreground underline underline-offset-2">
            상세 보기 →
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export function WeeklyRecommendationList() {
  const vc = useViewerContext();
  const overrides = useSessionInteractionStore(
    (state) => state.recommendationOverrides,
  );
  const [recs, setRecs] = useState<Recommendation[] | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: overrides는 거절/후기/승인 세션 반영 시 재조회를 트리거하기 위한 의도적 의존성(본문 미참조).
  useEffect(() => {
    let cancelled = false;
    getRecommendations(vc).then((result) => {
      if (!cancelled) {
        setRecs(sortByHotLeadPuzzleFirst(result));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vc, overrides]);

  if (recs === null) {
    return (
      <p className="px-[30px] py-6 text-sm text-guud-text-muted-2">
        추천을 불러오는 중입니다…
      </p>
    );
  }

  if (recs.length === 0) {
    return (
      <p className="px-[30px] py-6 text-sm text-guud-text-muted-2">
        이번 주 추천이 아직 없습니다. 온보딩을 완료하면 추천이 생성됩니다.
      </p>
    );
  }

  return (
    <div className="grid gap-4 px-[30px] py-6 sm:grid-cols-2 lg:grid-cols-3">
      {recs.map((rec) =>
        rec.rec_kind === "모듬" ? (
          <MeetupCard key={rec.id} rec={rec} />
        ) : (
          <RecommendationSummaryCard key={rec.id} rec={rec} />
        ),
      )}
    </div>
  );
}
