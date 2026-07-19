"use client";

// DealSourcingForm — 딜소싱 프로젝트 등록 폼(FR-DS-01/02). 정책사업 유무·참여자·사업내용·
// 기대효과를 입력해 등록하면 딜룸 파이프라인에 씨앗으로 반영되고(FR-DR-05 연동), 자원검색·
// 백오피스·금융 서비스로의 연결 CTA가 뜬다(FR-DS-02).
// 근거: ARCHITECTURE.md §5.3 registerDeal, §3 ② v1.1 3단계 경계(세션 쓰기 허용, A8 개정)
// 목업은 등록 시뮬레이션 — SessionInteraction 스토어에만 반영되고 새로고침 시 리셋된다(A6).

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import membersSeed from "@/data/members.json";
import { registerDeal } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { useViewerContext } from "@/stores/viewer-context";
import type { DealRoom } from "@/types";

type MemberSeed = { id: string; name: string; org: { name: string } };
const members = membersSeed as MemberSeed[];

export function DealSourcingForm() {
  const vc = useViewerContext();
  const [title, setTitle] = useState("");
  const [hasPolicyProgram, setHasPolicyProgram] = useState<
    "있음" | "없음" | ""
  >("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [businessContent, setBusinessContent] = useState("");
  const [expectedEffect, setExpectedEffect] = useState("");
  const [registered, setRegistered] = useState<DealRoom | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const otherMembers = members.filter((m) => m.id !== vc.personaId);
  const canSubmit =
    title.trim().length > 0 &&
    hasPolicyProgram !== "" &&
    businessContent.trim().length > 0 &&
    expectedEffect.trim().length > 0;

  function toggleParticipant(memberId: string) {
    setParticipantIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) {
      return;
    }
    setSubmitting(true);
    const deal = await registerDeal(vc, {
      title: title.trim(),
      hasPolicyProgram: hasPolicyProgram === "있음",
      participantMemberIds: participantIds,
      businessContent: businessContent.trim(),
      expectedEffect: expectedEffect.trim(),
    });
    setRegistered(deal);
    setSubmitting(false);
  }

  if (registered) {
    return (
      <div className="flex flex-col gap-4 border border-guud-hairline bg-muted p-6">
        <p className="text-sm font-semibold text-foreground">
          "{registered.title}" 딜이 씨앗 단계로 등록되었습니다(세션 한정,
          새로고침 시 초기화).
        </p>
        <p className="text-xs text-guud-text-muted-2">
          FR-DS-02: 등록된 딜에 이어 자원검색·백오피스·금융 서비스로 바로 연결할
          수 있습니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/resources">자원검색으로 이동</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/backoffice?dealId=${registered.id}`}>
              백오피스 맞춤 전문기관 보기
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/finance">금융 서비스 보기</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/deal-rooms">딜룸 보드에서 확인</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="deal-title">사업명</Label>
        <input
          id="deal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 로컬푸드 디지털전환 협업 딜"
          className="h-10 w-full border border-transparent border-b-input bg-transparent px-0 py-1 text-base outline-none placeholder:text-muted-foreground focus-visible:border-b-ring"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>정책사업 유무</Label>
        <RadioGroup
          value={hasPolicyProgram}
          onValueChange={(v) => setHasPolicyProgram(v as "있음" | "없음")}
          className="flex flex-row gap-4"
        >
          {(["있음", "없음"] as const).map((option) => (
            <div key={option} className="flex items-center gap-2">
              <RadioGroupItem value={option} id={`policy-program-${option}`} />
              <Label htmlFor={`policy-program-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label>참여자 (본인 외 추가 참여 회원)</Label>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {otherMembers.map((member) => {
            const active = participantIds.includes(member.id);
            return (
              <li key={member.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleParticipant(member.id)}
                  className={cn(
                    "w-full border px-3 py-2 text-left text-xs",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-guud-text-muted-2",
                  )}
                >
                  {member.name} · {member.org.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="deal-content">사업내용</Label>
        <Textarea
          id="deal-content"
          value={businessContent}
          onChange={(e) => setBusinessContent(e.target.value)}
          placeholder="이 딜에서 실제로 무엇을 하는지 설명해 주세요."
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="deal-effect">기대효과</Label>
        <Textarea
          id="deal-effect"
          value={expectedEffect}
          onChange={(e) => setExpectedEffect(e.target.value)}
          placeholder="이 딜이 성사되면 어떤 변화가 생기는지 설명해 주세요."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={!canSubmit || submitting}>
        {submitting ? "등록 중…" : "딜소싱 등록"}
      </Button>
    </form>
  );
}
