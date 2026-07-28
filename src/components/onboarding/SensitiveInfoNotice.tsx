"use client";

// SensitiveInfoNotice — 수요 후속질문 시작 전 민감정보 고지(FR-ON-07).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009b
// 문구는 interview_scripts.json meta.sensitive_notice 원문(창작 아님, A9).

import {
  Check,
  EyeOff,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function SensitiveInfoNotice({
  notice,
  onAcknowledge,
  hasHotLead,
}: {
  notice: string;
  onAcknowledge: () => void;
  hasHotLead: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-guud-hairline">
      <div className="bg-foreground p-6 text-background sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-full bg-background/10 text-primary">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <p className="mt-6 font-mono text-[0.625rem] tracking-[0.16em] text-primary uppercase">
          [ PRIVATE BY DESIGN ]
        </p>
        <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          고민은 숨기고,
          <br />
          연결의 정확도만 높입니다
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-background/65">
          {notice} 회원이 적은 표현은 바꾸지 않고 그대로 보존하며, 확정하기
          전에는 매칭에 사용하지 않습니다.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-2xl bg-muted p-4">
            <EyeOff className="size-5 text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              프로필에 비공개
            </p>
            <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
              수요와 고민은 다른 회원이 볼 수 없어요.
            </p>
          </li>
          <li className="rounded-2xl bg-muted p-4">
            <LockKeyhole className="size-5 text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              최소 범위만 사용
            </p>
            <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
              관련 추천을 만드는 데 필요한 정보만 써요.
            </p>
          </li>
          <li className="rounded-2xl bg-muted p-4">
            <MessageCircle className="size-5 text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              한 번에 한 질문
            </p>
            <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
              한 문장으로 답하고 원하면 건너뛸 수 있어요.
            </p>
          </li>
        </ul>

        {hasHotLead && (
          <p className="mt-5 rounded-2xl border border-primary/30 bg-secondary/60 p-4 text-sm leading-6 text-foreground">
            구체적인 프로젝트를 선택하셔서 기본 질문 뒤에 프로젝트·필요한
            파트너·진행 단계에 관해 세 가지만 더 여쭤볼게요.
          </p>
        )}

        <Button
          type="button"
          onClick={onAcknowledge}
          className="mt-6 w-full sm:w-auto"
        >
          <Check className="size-4" /> 확인했어요, 인터뷰 시작하기
        </Button>
      </div>
    </div>
  );
}
