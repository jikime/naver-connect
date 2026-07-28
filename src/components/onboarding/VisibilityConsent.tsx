"use client";

// VisibilityConsent — 스텝7 공개범위 동의 체크박스(FR-ON-08).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009b

import { Eye, LockKeyhole, ShieldCheck } from "lucide-react";
import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function VisibilityConsent({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="rounded-2xl border border-guud-hairline p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">
          공개 범위를 마지막으로 확인해주세요
        </p>
      </div>
      <div className="mt-4 grid gap-2 text-xs leading-5 text-guud-text-muted-2 sm:grid-cols-2">
        <p className="flex items-start gap-2 rounded-xl bg-muted p-3">
          <Eye className="mt-0.5 size-3.5 shrink-0 text-primary" /> 공급 정보,
          활동 선호, 지역은 전체 회원에게 공개
        </p>
        <p className="flex items-start gap-2 rounded-xl bg-muted p-3">
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-primary" />{" "}
          수요, 우선순위, 프로젝트, 가용시간은 본인·운영자만 확인
        </p>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-secondary/60 p-4">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(value) => onChange(value === true)}
          className="mt-0.5"
        />
        <Label htmlFor={id} className="text-sm leading-6 font-normal">
          위 공개·비공개 구분을 확인했으며, 확정 전까지 입력 내용이 매칭에
          사용되지 않는다는 점에 동의합니다.
        </Label>
      </div>
    </div>
  );
}
