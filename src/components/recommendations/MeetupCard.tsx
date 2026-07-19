// MeetupCard — 개설된 모듬 카드(공유 컴포넌트). 1:1 5문장 구조 대신 목적·참여후보·CTA 2종을 렌더한다.
// 근거: ARCHITECTURE.md §3(L3 공유 UI MeetupCard)·§4.3(설계 노트 B, ADR-06 v1.1 개정),
//       FR-RC-08/FR-GR-06/FR-MG-01
// v1.1: meetups.json이 모듬의 정본이라(ADR-06 개정) Recommendation이 아닌 Meetup을 직접 받는다.
// 주간 추천 리스트(모듬 변형 초대)와 개설된 모듬 목록(FR-MG-01) 화면이 공용으로 재사용한다.

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Meetup } from "@/types";

export function MeetupCard({
  meetup,
  introText,
}: {
  meetup: Meetup;
  /** 추천 흐름에서 호출될 때만: 모듬 초대 메시지의 소개 문장(FR-RC-08 초대 맥락) */
  introText?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
            모듬 · {meetup.type}
          </Badge>
          <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
            {meetup.region.sido} {meetup.region.sigungu}
          </Badge>
        </div>
        <CardTitle className="text-base normal-case tracking-normal">
          {introText ?? meetup.title}
        </CardTitle>
        <CardDescription>{meetup.purpose}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-guud-text-muted-2">
          참여 후보 {meetup.member_ids.length}인
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
