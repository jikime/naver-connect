"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Coffee,
  Lightbulb,
  MapPin,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CoffeeChatDialog } from "@/components/meetups/CoffeeChatDialog";
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
import { useMeetupSessionStore } from "@/stores/meetup-session";
import type { Meetup, Recommendation } from "@/types";

export interface MeetupMemberSummary {
  id: string;
  name: string;
  orgName: string;
  role: string;
}

const EMPTY_AVAILABILITY_BY_MEMBER = {};

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
  격차카드모둠개설: {
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
  AI추천: {
    label: "AI가 발견한 연결",
    description:
      "회원의 분야와 매칭 접점을 바탕으로 함께 대화해볼 구성을 제안했어요.",
    startingPoint: "AI 연결 추천",
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
  const joinedMemberIdsByMeetup = useMeetupSessionStore(
    (state) => state.joinedMemberIdsByMeetup,
  );
  const availabilityByMember = useMeetupSessionStore(
    (state) =>
      state.availabilityByMeetup[meetup.id] ?? EMPTY_AVAILABILITY_BY_MEMBER,
  );
  const joinMeetup = useMeetupSessionStore((state) => state.joinMeetup);
  const leaveMeetup = useMeetupSessionStore((state) => state.leaveMeetup);
  const formation = FORMATION_COPY[meetup.created_source];
  const host = membersById[meetup.host_member_id];
  const joinedMemberIds = [
    ...new Set([
      meetup.host_member_id,
      ...(joinedMemberIdsByMeetup[meetup.id] ?? []),
    ]),
  ];
  const joinedMembers = joinedMemberIds
    .map((id) => membersById[id])
    .filter((member): member is MeetupMemberSummary => Boolean(member));
  const candidateMembers = meetup.member_ids
    .filter((id) => !joinedMemberIds.includes(id))
    .map((id) => membersById[id])
    .filter((member): member is MeetupMemberSummary => Boolean(member));
  const fieldNames = meetup.field_tags
    .map((id) => fieldNamesById[id])
    .filter(Boolean);
  const isHost = viewerId === meetup.host_member_id;
  const hasJoined = Boolean(viewerId && joinedMemberIds.includes(viewerId));
  const canScheduleCoffeeChat = joinedMemberIds.length >= 2 && hasJoined;
  const isInvited = Boolean(
    recommendation && viewerId && meetup.member_ids.includes(viewerId),
  );

  function toggleParticipation() {
    if (!viewerId || isHost) return;
    if (hasJoined) {
      leaveMeetup(meetup.id, viewerId);
    } else {
      joinMeetup(meetup.id, viewerId);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
            모둠 · {meetup.type}
          </Badge>
          {isInvited && (
            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold tracking-normal text-primary normal-case">
              참여 후보로 추천됨
            </Badge>
          )}
          {meetup.created_source === "AI추천" && (
            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold tracking-normal text-primary normal-case">
              AI 추천
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
              {meetup.recommendation_reason && (
                <p className="mt-2 text-xs font-medium leading-5 text-foreground">
                  {meetup.recommendation_reason}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 font-mono text-[0.625rem] leading-4 font-medium tracking-[0.06em] text-guud-text-muted-2 uppercase">
            <span className="text-center">{formation.startingPoint}</span>
            <ArrowRight className="size-3" aria-hidden />
            <span className="text-center">주제·지역 확인</span>
            <ArrowRight className="size-3" aria-hidden />
            <span className="text-center">현재 모둠</span>
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
            {meetup.created_source === "AI추천" ? (
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <UserRound className="mt-0.5 size-4 shrink-0 text-guud-text-muted-2" />
            )}
            <div>
              <dt className="text-xs text-guud-text-muted-2">
                {meetup.created_source === "AI추천"
                  ? "AI 추천 호스트"
                  : "호스트"}
              </dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 font-medium text-foreground">
                <span>{host?.name ?? "호스트 확인 중"}</span>
                {meetup.host_recommendation_score !== undefined && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-semibold text-primary">
                    적합도 {meetup.host_recommendation_score}점
                  </span>
                )}
              </dd>
              {meetup.host_recommendation_reason && (
                <p className="mt-1 text-xs leading-5 text-guud-text-muted-2 sm:col-span-2">
                  {meetup.host_recommendation_reason}
                </p>
              )}
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
              참여 중 {joinedMemberIds.length}명
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
            <div className="mt-3 space-y-4">
              <ul className="space-y-2">
                {joinedMembers.length > 0 ? (
                  joinedMembers.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-primary/5 px-3 py-2"
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
                      <Check
                        className="size-4 shrink-0 text-primary"
                        aria-label="참여 중"
                      />
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-guud-text-muted-2">
                    참여자 정보를 불러오는 중입니다.
                  </li>
                )}
              </ul>

              {candidateMembers.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-guud-text-muted-2">
                    함께하면 좋은 참여 후보
                  </p>
                  <ul className="space-y-2">
                    {candidateMembers.map((member) => (
                      <li
                        key={member.id}
                        className="rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <span className="block truncate text-sm font-medium text-foreground">
                          {member.name}
                        </span>
                        <span className="block truncate text-xs text-guud-text-muted-2">
                          {member.orgName} · {member.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {joinedMemberIds.length < 2 && (
          <p className="flex items-center gap-2 text-xs text-guud-text-muted-2">
            <Coffee className="size-3.5" aria-hidden />한 명이 더 참여하면
            온라인 첫 미팅 가능 시간을 공유할 수 있어요.
          </p>
        )}
        {joinedMemberIds.length >= 2 && !hasJoined && (
          <p className="flex items-center gap-2 text-xs text-guud-text-muted-2">
            <Coffee className="size-3.5" aria-hidden />
            모둠에 참여하면 가능한 시간을 함께 공유할 수 있어요.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={hasJoined ? "secondary" : "default"}
            aria-pressed={hasJoined}
            disabled={!viewerId || isHost}
            onClick={toggleParticipation}
          >
            {hasJoined && <Check aria-hidden />}
            {isHost
              ? "내가 개설한 모둠"
              : hasJoined
                ? "참여 중 · 취소"
                : "참여하기"}
          </Button>
          {viewerId && (
            <CoffeeChatDialog
              meetup={meetup}
              viewerId={viewerId}
              enabled={canScheduleCoffeeChat}
              availabilityByMember={availabilityByMember}
              participants={joinedMembers.map((member) => ({
                id: member.id,
                name: member.name,
              }))}
            />
          )}
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
