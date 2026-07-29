"use client";

// MeetupList — 개설된 모둠 목록·검색(v1.1 · 1-6, 신규 화면). 유형·분야·지역 필터.
// 근거: ARCHITECTURE.md §3(L2 MeetupList), TASKS v1.1, FR-MG-01
// 정본은 meetups.json(ADR-06 v1.1 개정) — MeetupCard(공유 컴포넌트)를 그대로 재사용한다.

import { Layers3, MapPin, RotateCcw, Search, Tags } from "lucide-react";
import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { MeetupCreateDialog } from "@/components/meetups/MeetupCreateDialog";
import { MeetupCard } from "@/components/recommendations/MeetupCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFields, getMatchScores, getMeetups, getMembers } from "@/lib/dal";
import { buildAiSuggestedMeetups } from "@/lib/meetup-recommendations";
import { cn } from "@/lib/utils";
import { useMeetupSessionStore } from "@/stores/meetup-session";
import { useViewerContext } from "@/stores/viewer-context";
import type { Field, MaskedMember, MatchScore, Meetup } from "@/types";

const MEETUP_TYPES: Meetup["type"][] = [
  "학습모임",
  "취미모임",
  "지역앰배서더",
  "공공모둠",
];

function FilterChoice({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-guud-hairline bg-background text-guud-text-muted-2 hover:border-foreground/25 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function MeetupList() {
  const vc = useViewerContext();
  const [query, setQuery] = useState("");
  const [sido, setSido] = useState<string | "all">("all");
  const [type, setType] = useState<Meetup["type"] | "all">("all");
  const [fieldId, setFieldId] = useState<number | "all">("all");
  const [fields, setFields] = useState<Field[]>([]);
  const [members, setMembers] = useState<MaskedMember[]>([]);
  const [scores, setScores] = useState<MatchScore[]>([]);
  const [seedMeetups, setSeedMeetups] = useState<Meetup[] | null>(null);
  const createdMeetups = useMeetupSessionStore((state) => state.createdMeetups);
  const queryInputId = useId();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getFields(),
      getMembers(vc),
      getMeetups(vc),
      getMatchScores(vc),
    ]).then(([fieldResult, memberResult, meetupResult, matchingResult]) => {
      if (!cancelled) {
        setFields(fieldResult);
        setMembers(memberResult);
        setSeedMeetups(meetupResult);
        setScores(matchingResult.scores);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vc]);

  const aiMeetups = useMemo(
    () => buildAiSuggestedMeetups(members, fields, scores),
    [fields, members, scores],
  );
  const allMeetups = useMemo(
    () => [...createdMeetups, ...aiMeetups, ...(seedMeetups ?? [])],
    [aiMeetups, createdMeetups, seedMeetups],
  );
  const meetups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allMeetups.filter((meetup) => {
      if (type !== "all" && meetup.type !== type) return false;
      if (fieldId !== "all" && !meetup.field_tags.includes(fieldId)) {
        return false;
      }
      if (sido !== "all" && meetup.region.sido !== sido) return false;
      if (
        normalizedQuery &&
        !`${meetup.title} ${meetup.purpose}`
          .toLowerCase()
          .includes(normalizedQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [allMeetups, fieldId, query, sido, type]);

  const sidoOptions = Array.from(
    new Set(allMeetups.map((meetup) => meetup.region.sido)),
  );
  const availableFieldIds = new Set(
    allMeetups.flatMap((meetup) => meetup.field_tags),
  );
  const fieldOptions = fields.filter((field) =>
    availableFieldIds.has(field.id),
  );
  const hasActiveFilters =
    query.trim().length > 0 ||
    sido !== "all" ||
    type !== "all" ||
    fieldId !== "all";

  function resetFilters() {
    setQuery("");
    setSido("all");
    setType("all");
    setFieldId("all");
  }

  const membersById = Object.fromEntries(
    members.map((member) => [
      member.id,
      {
        id: member.id,
        name: member.name,
        orgName: member.org.name,
        role: member.org.role,
      },
    ]),
  );
  const fieldNamesById = Object.fromEntries(
    fields.map((field) => [field.id, field.name]),
  );
  const viewer = members.find((member) => member.id === vc.personaId);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-14 sm:px-10 lg:px-16">
      <section aria-labelledby="meetup-list-title" className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2
              id="meetup-list-title"
              className="font-heading text-2xl font-medium tracking-tight text-foreground"
            >
              개설된 모둠
            </h2>
            <p className="text-sm text-guud-text-muted-2">
              관심 있는 모둠에 참여해보세요. 두 명 이상 모이면 온라인 첫 미팅
              가능 시간을 함께 공유할 수 있어요.
            </p>
          </div>
          <MeetupCreateDialog fields={fields} viewer={viewer} />
        </div>

        <div className="rounded-2xl border border-guud-hairline bg-card p-5 sm:p-6">
          <div className="relative">
            <Label
              htmlFor={queryInputId}
              className="mb-2 text-xs font-semibold text-guud-text-muted-2"
            >
              제목·목적 키워드로 검색
            </Label>
            <Search
              className="pointer-events-none absolute bottom-3 left-3.5 size-4 text-guud-text-muted-2"
              aria-hidden
            />
            <Input
              id={queryInputId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 학습모임, 돌봄"
              className="pl-10"
            />
          </div>

          <div className="mt-5 grid gap-5 border-t border-guud-hairline pt-5">
            <fieldset>
              <legend className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="size-4 text-primary" aria-hidden />
                지역
              </legend>
              <div className="flex flex-wrap gap-2">
                <FilterChoice
                  active={sido === "all"}
                  onClick={() => setSido("all")}
                >
                  전체
                </FilterChoice>
                {sidoOptions.map((option) => (
                  <FilterChoice
                    key={option}
                    active={sido === option}
                    onClick={() => setSido(option)}
                  >
                    {option}
                  </FilterChoice>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Layers3 className="size-4 text-primary" aria-hidden />
                유형
              </legend>
              <div className="flex flex-wrap gap-2">
                <FilterChoice
                  active={type === "all"}
                  onClick={() => setType("all")}
                >
                  전체
                </FilterChoice>
                {MEETUP_TYPES.map((option) => (
                  <FilterChoice
                    key={option}
                    active={type === option}
                    onClick={() => setType(option)}
                  >
                    {option}
                  </FilterChoice>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Tags className="size-4 text-primary" aria-hidden />
                분야
              </legend>
              <div className="flex flex-wrap gap-2">
                <FilterChoice
                  active={fieldId === "all"}
                  onClick={() => setFieldId("all")}
                >
                  전체
                </FilterChoice>
                {fieldOptions.map((field) => (
                  <FilterChoice
                    key={field.id}
                    active={fieldId === field.id}
                    onClick={() => setFieldId(field.id)}
                  >
                    {field.name}
                  </FilterChoice>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {seedMeetups !== null && (
          <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-guud-text-muted-2">
              조건에 맞는 모둠{" "}
              <strong className="font-semibold text-foreground">
                {meetups.length}개
              </strong>
            </p>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                <RotateCcw aria-hidden />
                선택 초기화
              </Button>
            )}
          </div>
        )}

        {seedMeetups === null ? (
          <p className="text-sm text-guud-text-muted-2">불러오는 중입니다…</p>
        ) : meetups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-guud-hairline px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              조건에 맞는 모둠이 없습니다.
            </p>
            <p className="mt-1 text-xs text-guud-text-muted-2">
              다른 지역·유형·분야를 선택해보세요.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={resetFilters}
            >
              <RotateCcw aria-hidden />
              전체 모둠 보기
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meetups.map((meetup) => (
              <MeetupCard
                key={meetup.id}
                meetup={meetup}
                membersById={membersById}
                fieldNamesById={fieldNamesById}
                viewerId={vc.personaId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
