"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Lightbulb,
  MapPin,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Meetup, Recommendation } from "@/types";

export interface MeetupMemberSummary {
  id: string;
  name: string;
  orgName: string;
  role: string;
}

const FORMATION_COPY: Record<
  Meetup["created_source"],
  { label: string; description: string; startingPoint: string }
> = {
  공공중간지원추천: {
    label: "공정한 다자 연결",
    description:
      "공공·중간지원 역할은 특정 회원과의 1:1 대신 여러 참여자가 함께 만나는 방식으로 연결해요.",
    startingPoint: "공공·중간지원 추천",
  },
  격차카드모듬개설: {
    label: "격차 리포트에서 출발",
    description:
      "지역 생태계의 연결 공백을 발견한 뒤, 해당 분야를 채울 수 있는 회원을 모았어요.",
    startingPoint: "격차·기회 카드",
  },
  자발개설: {
    label: "회원 제안으로 개설",
    description:
      "회원이 제안한 주제와 공통 관심사를 중심으로 함께할 사람을 모았어요.",
    startingPoint: "회원 제안·추천 발전",
  },
};

export function MeetupCard({
  meetup,
  recommendation,
  membersById = {},
  fieldNamesById = {},
  viewerId,
}: {
  meetup: Meetup;
  recommendation?: Recommendation;
  membersById?: Record<string, MeetupMemberSummary>;
  fieldNamesById?: Record<number, string>;
  viewerId?: string;
}) {
  const [showMembers, setShowMembers] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const formation = FORMATION_COPY[meetup.created_source];
  const host = membersById[meetup.host_member_id];
  const members = meetup.member_ids
    .map((id) => membersById[id])
    .filter((member): member is MeetupMemberSummary => Boolean(member));
  const fieldNames = meetup.field_tags
    .map((id) => fieldNamesById[id])
    .filter(Boolean);
  const isInvited = Boolean(
    recommendation && viewerId && meetup.member_ids.includes(viewerId),
  );

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
            모듬 · {meetup.type}
          </Badge>
          {isInvited && (
            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold tracking-normal text-primary normal-case">
              참여 후보로 추천됨
            </Badge>
          )}
        </div>
        <div className="space-y-1.5">
          <CardTitle>{meetup.title}</CardTitle>
          <CardDescription>{meetup.purpose}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        {recommendation && (
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              이번 주 초대 이유
            </div>
            <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
              {recommendation.message.intro}
            </p>
            <p className="mt-1.5 text-xs leading-5 text-guud-text-muted-2">
              {recommendation.message.your_benefit}
            </p>
          </div>
        )}

        <div className="rounded-xl bg-muted/60 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {formation.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
                {formation.description}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 font-mono text-[0.625rem] leading-4 font-medium tracking-[0.06em] text-guud-text-muted-2 uppercase">
            <span className="text-center">{formation.startingPoint}</span>
            <ArrowRight className="size-3" aria-hidden />
            <span className="text-center">주제·지역 확인</span>
            <ArrowRight className="size-3" aria-hidden />
            <span className="text-center">현재 모듬</span>
          </div>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-guud-text-muted-2" />
            <div>
              <dt className="text-xs text-guud-text-muted-2">활동 지역</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {meetup.region.sido} {meetup.region.sigungu}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 size-4 shrink-0 text-guud-text-muted-2" />
            <div>
              <dt className="text-xs text-guud-text-muted-2">호스트</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {host?.name ?? "호스트 확인 중"}
              </dd>
            </div>
          </div>
        </dl>

        {fieldNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {fieldNames.map((name) => (
              <Badge
                key={name}
                className="rounded-full border-0 bg-secondary px-2.5 py-1 font-medium tracking-normal text-secondary-foreground normal-case"
              >
                {name}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto border-t border-guud-hairline pt-4">
          <button
            type="button"
            aria-expanded={showMembers}
            onClick={() => setShowMembers((current) => !current)}
            className="flex min-h-9 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-foreground"
          >
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              참여 후보 {meetup.member_ids.length}명
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-guud-text-muted-2 transition-transform",
                showMembers && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {showMembers && (
            <ul className="mt-3 space-y-2">
              {members.length > 0 ? (
                members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {member.name}
                        {member.id === meetup.host_member_id && (
                          <span className="ml-1.5 text-xs text-primary">
                            호스트
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-guud-text-muted-2">
                        {member.orgName} · {member.role}
                      </span>
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-guud-text-muted-2">
                  구성원 정보를 불러오는 중입니다.
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={hasJoined ? "secondary" : "default"}
            aria-pressed={hasJoined}
            onClick={() => setHasJoined((current) => !current)}
          >
            {hasJoined && <Check aria-hidden />}
            {hasJoined ? "참여 의향 선택됨" : "참여 의향 남기기"}
          </Button>
          {recommendation && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/recommendations/${recommendation.id}`}>
                초대 이유 자세히
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
