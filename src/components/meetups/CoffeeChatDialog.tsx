"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Users,
  Video,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveMeetupAvailability } from "@/lib/dal/meetup-state";
import { cn } from "@/lib/utils";
import type {
  Meetup,
  MeetupAvailability,
  MeetupAvailabilitySlot,
} from "@/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TIME_SLOTS = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 10 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function readableDate(date: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(fromIsoDate(date));
}

function nextAvailableDate(): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 7);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return toIsoDate(date);
}

function isSelectableDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 45);
  return date >= today && date <= limit && date.getDay() !== 0;
}

function availabilityKey(slot: MeetupAvailabilitySlot): string {
  return `${slot.date}|${slot.time}`;
}

function availabilityFromKey(key: string): MeetupAvailabilitySlot {
  const [date, time] = key.split("|");
  return { date, time };
}

export function CoffeeChatDialog({
  meetup,
  viewerId,
  enabled,
  availabilityByMember = {},
  participants = [],
}: {
  meetup: Meetup;
  viewerId: string;
  enabled: boolean;
  availabilityByMember?: Record<string, MeetupAvailability>;
  participants?: { id: string; name: string }[];
}) {
  const viewerAvailability = availabilityByMember[viewerId];
  const initialDate = viewerAvailability?.slots[0]?.date ?? nextAvailableDate();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>(() =>
    (viewerAvailability?.slots ?? []).map(availabilityKey),
  );
  const initialDateValue = fromIsoDate(initialDate);
  const [visibleMonth, setVisibleMonth] = useState(
    () =>
      new Date(
        initialDateValue.getFullYear(),
        initialDateValue.getMonth(),
        1,
        12,
      ),
  );

  const calendarCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1, 12).getDay();
    const lastDate = new Date(year, month + 1, 0, 12).getDate();

    return Array.from({ length: 42 }, (_, cellPosition) => {
      const day = cellPosition - firstWeekday + 1;
      return {
        key: `${year}-${month}-${day}`,
        date: day < 1 || day > lastDate ? null : new Date(year, month, day, 12),
      };
    });
  }, [visibleMonth]);
  const selectedTimesForDate = useMemo(
    () =>
      new Set(
        selectedSlotKeys
          .map(availabilityFromKey)
          .filter((slot) => slot.date === selectedDate)
          .map((slot) => slot.time),
      ),
    [selectedDate, selectedSlotKeys],
  );
  const sharedMemberCount = participants.filter(
    (participant) =>
      (availabilityByMember[participant.id]?.slots.length ?? 0) > 0,
  ).length;
  const overlappingSlots = useMemo(() => {
    const counts = new Map<string, number>();
    for (const participant of participants) {
      const uniqueKeys = new Set(
        (availabilityByMember[participant.id]?.slots ?? []).map(
          availabilityKey,
        ),
      );
      for (const key of uniqueKeys) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .map(([key, count]) => ({
        ...availabilityFromKey(key),
        count,
      }))
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.date.localeCompare(b.date) ||
          a.time.localeCompare(b.time),
      );
  }, [availabilityByMember, participants]);

  function moveMonth(offset: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      const nextDate =
        viewerAvailability?.slots[0]?.date ?? nextAvailableDate();
      const nextDateValue = fromIsoDate(nextDate);
      setSelectedDate(nextDate);
      setVisibleMonth(
        new Date(nextDateValue.getFullYear(), nextDateValue.getMonth(), 1, 12),
      );
      setSelectedSlotKeys(
        (viewerAvailability?.slots ?? []).map(availabilityKey),
      );
    }
    setOpen(nextOpen);
  }

  function toggleTime(time: string) {
    const key = availabilityKey({ date: selectedDate, time });
    setSelectedSlotKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key].sort(),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedSlotKeys.length === 0) return;
    await saveMeetupAvailability({
      meetup_id: meetup.id,
      member_id: viewerId,
      slots: selectedSlotKeys.map(availabilityFromKey),
    });
    setOpen(false);
  }

  return (
    <>
      {sharedMemberCount > 0 && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-primary">
            <CalendarDays className="size-3.5" aria-hidden />
            가능 시간 공유 현황
          </p>
          <p className="mt-1.5 text-sm font-medium text-foreground">
            참여자 {participants.length}명 중 {sharedMemberCount}명 공유
          </p>
          {overlappingSlots[0] && (
            <p className="mt-0.5 text-xs text-guud-text-muted-2">
              가장 많이 겹치는 시간: {readableDate(overlappingSlots[0].date)}{" "}
              {overlappingSlots[0].time} · {overlappingSlots[0].count}명 가능
            </p>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="outline" disabled={!enabled}>
            <Coffee aria-hidden />
            {viewerAvailability ? "공유한 시간 수정" : "가능 시간 공유하기"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto p-0 sm:max-w-5xl">
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-[13rem_minmax(18rem,1fr)_11rem]">
              <aside className="border-b border-guud-hairline bg-guud-header-band p-6 md:border-r md:border-b-0">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Video className="size-5" aria-hidden />
                </div>
                <DialogHeader className="mt-5">
                  <DialogTitle className="text-xl leading-tight">
                    온라인 첫 미팅 가능 시간을 공유해보세요
                  </DialogTitle>
                  <DialogDescription>
                    각자 편한 시간을 알려주면 서로 겹치는 시간을 확인할 수
                    있어요.
                  </DialogDescription>
                </DialogHeader>

                <dl className="mt-6 space-y-4 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Clock3
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden
                    />
                    <div>
                      <dt className="text-xs text-guud-text-muted-2">
                        일정 조율
                      </dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        온라인 · 30분
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users className="mt-0.5 size-4 text-primary" aria-hidden />
                    <div>
                      <dt className="text-xs text-guud-text-muted-2">참여자</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {participants.length}명
                      </dd>
                      {participants.length > 0 && (
                        <dd className="mt-2 space-y-1.5">
                          {participants.map((participant) => {
                            const slotCount =
                              availabilityByMember[participant.id]?.slots
                                .length ?? 0;
                            return (
                              <span
                                key={participant.id}
                                className="flex items-center justify-between gap-3 text-xs text-guud-text-muted-2"
                              >
                                <span>{participant.name}</span>
                                <span
                                  className={cn(
                                    "shrink-0 font-medium",
                                    slotCount > 0 && "text-primary",
                                  )}
                                >
                                  {slotCount > 0
                                    ? `${slotCount}개 공유`
                                    : "공유 전"}
                                </span>
                              </span>
                            );
                          })}
                        </dd>
                      )}
                    </div>
                  </div>
                </dl>

                <p className="mt-8 rounded-xl border border-primary/15 bg-background/80 p-3 text-xs leading-5 text-guud-text-muted-2">
                  여기서는 일정이 확정되지 않아요. 참여자들의 가능 시간을 모아
                  겹치는 시간을 찾는 단계입니다.
                </p>
                {overlappingSlots.length > 0 && (
                  <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-3">
                    <p className="text-xs font-semibold text-primary">
                      서로 겹치는 시간
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-foreground">
                      {overlappingSlots.slice(0, 3).map((slot) => (
                        <li key={availabilityKey(slot)}>
                          {readableDate(slot.date)} {slot.time} · {slot.count}명
                          가능
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>

              <section className="border-b border-guud-hairline p-6 md:border-r md:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      가능한 날짜를 골라주세요
                    </p>
                    <p className="mt-1 text-xs text-guud-text-muted-2">
                      날짜를 바꿔가며 여러 시간을 선택할 수 있어요.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveMonth(-1)}
                      aria-label="이전 달"
                    >
                      <ChevronLeft aria-hidden />
                    </Button>
                    <p
                      className="min-w-24 text-center text-sm font-semibold"
                      aria-live="polite"
                    >
                      {visibleMonth.getFullYear()}년{" "}
                      {visibleMonth.getMonth() + 1}월
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveMonth(1)}
                      aria-label="다음 달"
                    >
                      <ChevronRight aria-hidden />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-7 gap-y-2 text-center">
                  {WEEKDAYS.map((weekday) => (
                    <div
                      key={weekday}
                      className="pb-2 text-xs font-medium text-guud-text-muted-2"
                    >
                      {weekday}
                    </div>
                  ))}
                  {calendarCells.map((cell) => {
                    const date = cell.date;
                    const isoDate = date ? toIsoDate(date) : "";
                    const hasSelectedTime = selectedSlotKeys.some((key) =>
                      key.startsWith(`${isoDate}|`),
                    );
                    return date ? (
                      <button
                        key={cell.key}
                        type="button"
                        disabled={!isSelectableDate(date)}
                        aria-pressed={selectedDate === isoDate}
                        aria-label={`${readableDate(isoDate)}${hasSelectedTime ? " · 가능 시간 선택됨" : ""}`}
                        onClick={() => setSelectedDate(isoDate)}
                        className={cn(
                          "relative mx-auto flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                          selectedDate === isoDate
                            ? "bg-primary text-primary-foreground"
                            : isSelectableDate(date)
                              ? "bg-secondary text-foreground hover:bg-primary/15 hover:text-primary"
                              : "text-guud-text-muted-2/35",
                        )}
                      >
                        {date.getDate()}
                        {hasSelectedTime && selectedDate !== isoDate && (
                          <span
                            className="absolute bottom-1 size-1 rounded-full bg-primary"
                            aria-hidden
                          />
                        )}
                      </button>
                    ) : (
                      <span key={cell.key} aria-hidden />
                    );
                  })}
                </div>
              </section>

              <section className="p-6">
                <p className="text-sm font-semibold text-foreground">
                  가능한 시간 선택
                </p>
                <p className="mt-1 min-h-5 text-xs text-guud-text-muted-2">
                  {readableDate(selectedDate)} · 여러 개 선택 가능
                </p>

                <div className="mt-5 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 md:grid-cols-1">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      aria-pressed={selectedTimesForDate.has(time)}
                      onClick={() => toggleTime(time)}
                      className={cn(
                        "flex min-h-10 items-center justify-between rounded-lg border px-3 text-sm font-medium transition-colors",
                        selectedTimesForDate.has(time)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-guud-hairline bg-background text-foreground hover:border-primary/40 hover:bg-primary/5",
                      )}
                    >
                      {time}
                      {selectedTimesForDate.has(time) && (
                        <Check className="size-4" aria-hidden />
                      )}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <DialogFooter className="border-t border-guud-hairline bg-background px-6 py-4">
              <div className="mr-auto hidden text-xs text-guud-text-muted-2 sm:block">
                {selectedSlotKeys.length > 0
                  ? `가능 시간 ${selectedSlotKeys.length}개 선택됨 · 참여자에게 공유됩니다`
                  : "가능한 시간을 하나 이상 선택해주세요."}
              </div>
              <Button type="submit" disabled={selectedSlotKeys.length === 0}>
                {viewerAvailability
                  ? "공유 내용 저장하기"
                  : "가능 시간 공유하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
