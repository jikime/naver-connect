// MeetupCard — 모듬 변형 추천 카드(N-7/ADR-06). 1:1 5문장 구조 대신 목적·참여후보·CTA 2종을 렌더한다.
// 근거: ARCHITECTURE.md §4.3(설계 노트 N-7 모듬 카드), §7 ADR-06, TASKS.md T-012, FR-RC-08/FR-GR-06
// 공공중간지원 회원(예: 오유진)에게는 getRecommendations(T-003)가 1:1 대신 이 변형만 반환한다.

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
import type { Recommendation } from "@/types";

export function MeetupCard({ rec }: { rec: Recommendation }) {
  const meetup = rec.meetup;
  if (!meetup) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-1.5">
          <MatchTypeBadge type={rec.match_type} />
          <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
            모듬 · {meetup.type}
          </Badge>
        </div>
        <CardTitle className="text-base normal-case tracking-normal">
          {rec.message.intro}
        </CardTitle>
        <CardDescription>{meetup.purpose}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-guud-text-muted-2">
          참여 후보 {meetup.member_ids.length}인 · 첫 행동:{" "}
          {rec.message.first_action}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">모듬 개설</Button>
          <Button size="sm" variant="outline">
            참여
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
