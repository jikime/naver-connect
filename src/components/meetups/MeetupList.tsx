"use client";

// MeetupList — 개설된 모듬 목록·검색(v1.1 · 1-6, 신규 화면). 유형·분야·지역 필터.
// 근거: ARCHITECTURE.md §3(L2 MeetupList), TASKS v1.1, FR-MG-01
// 정본은 meetups.json(ADR-06 v1.1 개정) — MeetupCard(공유 컴포넌트)를 그대로 재사용한다.

import { useEffect, useId, useState } from "react";
import { MeetupCard } from "@/components/recommendations/MeetupCard";
import { getFields, getMeetups } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { Field, Meetup } from "@/types";

const MEETUP_TYPES: Meetup["type"][] = [
  "학습모임",
  "취미모임",
  "지역앰배서더",
  "공공모듬",
];

export function MeetupList() {
  const vc = useViewerContext();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<Meetup["type"] | "all">("all");
  const [fieldId, setFieldId] = useState<number | "all">("all");
  const [fields, setFields] = useState<Field[]>([]);
  const [meetups, setMeetups] = useState<Meetup[] | null>(null);
  const queryInputId = useId();
  const typeSelectId = useId();
  const fieldSelectId = useId();

  useEffect(() => {
    getFields().then(setFields);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMeetups(vc, {
      type: type === "all" ? undefined : type,
      fieldId: fieldId === "all" ? undefined : fieldId,
      query: query || undefined,
    }).then((result) => {
      if (!cancelled) setMeetups(result);
    });
    return () => {
      cancelled = true;
    };
  }, [vc, query, type, fieldId]);

  return (
    <div className="space-y-6 px-[30px] py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor={queryInputId}
            className="mb-1 block text-xs font-semibold text-guud-text-muted-2"
          >
            제목·목적 키워드로 검색
          </label>
          <input
            id={queryInputId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 학습모임, 돌봄"
            className="w-full border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor={typeSelectId}
            className="mb-1 block text-xs font-semibold text-guud-text-muted-2"
          >
            유형
          </label>
          <select
            id={typeSelectId}
            value={type}
            onChange={(e) => setType(e.target.value as Meetup["type"] | "all")}
            className="border border-input bg-background px-2 py-2 text-sm"
          >
            <option value="all">전체 유형</option>
            {MEETUP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={fieldSelectId}
            className="mb-1 block text-xs font-semibold text-guud-text-muted-2"
          >
            분야
          </label>
          <select
            id={fieldSelectId}
            value={fieldId}
            onChange={(e) =>
              setFieldId(
                e.target.value === "all" ? "all" : Number(e.target.value),
              )
            }
            className="border border-input bg-background px-2 py-2 text-sm"
          >
            <option value="all">전체 분야</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {meetups === null ? (
        <p className="text-sm text-guud-text-muted-2">불러오는 중입니다…</p>
      ) : meetups.length === 0 ? (
        <p className="text-sm text-guud-text-muted-2">
          조건에 맞는 모듬이 없습니다.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetups.map((meetup) => (
            <MeetupCard key={meetup.id} meetup={meetup} />
          ))}
        </div>
      )}
    </div>
  );
}
