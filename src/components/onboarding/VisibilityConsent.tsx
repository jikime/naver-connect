"use client";

// VisibilityConsent — 스텝7 공개범위 동의 체크박스(FR-ON-08).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009b

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
    <div className="flex items-start gap-2 border border-guud-hairline p-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        className="mt-0.5"
      />
      <Label htmlFor={id} className="text-sm leading-snug font-normal">
        공급 정보·활동 선호·지역은 전체 회원에게 공개되고, 수요 태그(우선순위
        포함)·핫리드 정보·가용시간은 본인과 운영자만 볼 수 있다는 것을
        확인했으며 이 구분에 동의합니다.
      </Label>
    </div>
  );
}
