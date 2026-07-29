"use client";

import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMeetupSessionStore } from "@/stores/meetup-session";
import type { Field, MaskedMember, Meetup } from "@/types";

const MEETUP_TYPES: Meetup["type"][] = [
  "학습모임",
  "취미모임",
  "지역앰배서더",
  "공공모둠",
];

export function MeetupCreateDialog({
  fields,
  viewer,
}: {
  fields: Field[];
  viewer?: MaskedMember;
}) {
  const addMeetup = useMeetupSessionStore((state) => state.addMeetup);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [type, setType] = useState<Meetup["type"]>("학습모임");
  const [fieldId, setFieldId] = useState<number | null>(
    viewer?.field_tags[0] ?? null,
  );
  const [sido, setSido] = useState(viewer?.region.sido ?? "");
  const [sigungu, setSigungu] = useState(viewer?.region.sigungu ?? "");

  function resetForm() {
    setTitle("");
    setPurpose("");
    setType("학습모임");
    setFieldId(viewer?.field_tags[0] ?? null);
    setSido(viewer?.region.sido ?? "");
    setSigungu(viewer?.region.sigungu ?? "");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setFieldId((current) => current ?? viewer?.field_tags[0] ?? null);
      setSido((current) => current || viewer?.region.sido || "");
      setSigungu((current) => current || viewer?.region.sigungu || "");
    }
    setOpen(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer || !title.trim() || !purpose.trim() || fieldId === null) {
      return;
    }

    addMeetup({
      id: `USER-MU-${Date.now()}`,
      type,
      title: title.trim(),
      purpose: purpose.trim(),
      field_tags: [fieldId],
      region: {
        sido: sido.trim(),
        sigungu: sigungu.trim(),
      },
      member_ids: [viewer.id],
      host_member_id: viewer.id,
      created_source: "자발개설",
    });
    setOpen(false);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          className="size-11 rounded-full"
          aria-label="모둠 만들기"
          disabled={!viewer}
        >
          <Plus className="size-5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>새 모둠 만들기</DialogTitle>
          <DialogDescription>
            함께 이야기하고 싶은 주제를 열어두면 다른 회원이 참여할 수 있어요.
            두 명 이상 모이면 온라인 첫 미팅 가능 시간을 공유할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="meetup-title">모둠 이름</Label>
            <Input
              id="meetup-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 돌봄 현장 데이터 같이 읽기"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meetup-purpose">함께 나눌 이야기</Label>
            <Textarea
              id="meetup-purpose"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="어떤 사람과 무엇을 이야기하고 싶은지 적어주세요."
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="meetup-type">유형</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as Meetup["type"])}
              >
                <SelectTrigger id="meetup-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETUP_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meetup-field">분야</Label>
              <Select
                value={fieldId === null ? undefined : String(fieldId)}
                onValueChange={(value) => setFieldId(Number(value))}
              >
                <SelectTrigger id="meetup-field" className="w-full">
                  <SelectValue placeholder="분야 선택" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={String(field.id)}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">활동 지역</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="meetup-sido">시·도</Label>
                <Input
                  id="meetup-sido"
                  value={sido}
                  onChange={(event) => setSido(event.target.value)}
                  placeholder="서울"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meetup-sigungu">시·군·구</Label>
                <Input
                  id="meetup-sigungu"
                  value={sigungu}
                  onChange={(event) => setSigungu(event.target.value)}
                  placeholder="은평구"
                  required
                />
              </div>
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                !viewer ||
                !title.trim() ||
                !purpose.trim() ||
                fieldId === null ||
                !sido.trim() ||
                !sigungu.trim()
              }
            >
              모둠 개설하기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
