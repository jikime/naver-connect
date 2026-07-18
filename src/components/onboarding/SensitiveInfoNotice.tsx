"use client";

// SensitiveInfoNotice — 수요 후속질문 시작 전 민감정보 고지(FR-ON-07).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009b
// 문구는 interview_scripts.json meta.sensitive_notice 원문(창작 아님, A9).

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SensitiveInfoNotice({
  notice,
  onAcknowledge,
}: {
  notice: string;
  onAcknowledge: () => void;
}) {
  return (
    <div className="space-y-4 border border-guud-hairline bg-muted p-4">
      <div className="flex items-start gap-2">
        <ShieldCheck
          className="mt-0.5 size-5 shrink-0 text-foreground"
          aria-hidden
        />
        <p className="text-sm text-foreground">{notice}</p>
      </div>
      <Button type="button" size="sm" onClick={onAcknowledge}>
        확인했어요, 계속할게요
      </Button>
    </div>
  );
}
