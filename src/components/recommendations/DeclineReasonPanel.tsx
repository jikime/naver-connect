"use client";

// DeclineReasonPanel — [이번엔 패스할게요] 원탭 5사유 + 기타 한 줄 입력 + 엔진 반영 안내.
// 근거: ARCHITECTURE.md §5.3(submitDecline), TASKS.md T-014, FR-FB-01/02/03

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitDecline } from "@/lib/dal";
import { cn } from "@/lib/utils";
import type { DeclineReason, DeclineReasonCode, ViewerContext } from "@/types";

export function DeclineReasonPanel({
  vc,
  recId,
  reasons,
  onSubmitted,
  onCancel,
}: {
  vc: ViewerContext;
  recId: string;
  reasons: DeclineReason[];
  onSubmitted: (reason: DeclineReason, note?: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<DeclineReasonCode | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(code: DeclineReasonCode, noteValue?: string) {
    setSubmitting(true);
    setError(null);
    try {
      const reason = await submitDecline(vc, recId, code, noteValue);
      onSubmitted(reason, noteValue);
    } catch {
      setError("본인에게 온 추천만 반응할 수 있어요.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReasonClick(reason: DeclineReason) {
    if (reason.code === "기타") {
      setSelected("기타");
      return;
    }
    setSelected(reason.code);
    void submit(reason.code);
  }

  return (
    <div className="space-y-3 border border-guud-hairline bg-muted p-4">
      <p className="text-sm font-semibold text-foreground">
        패스 사유를 골라주세요(한 번만 탭하면 바로 반영돼요)
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {reasons.map((reason) => (
          <button
            key={reason.code}
            type="button"
            disabled={submitting}
            onClick={() => handleReasonClick(reason)}
            className={cn(
              "border px-3 py-2 text-left text-sm transition-colors disabled:opacity-50",
              selected === reason.code
                ? "border-foreground bg-background"
                : "border-border bg-background hover:bg-background/60",
            )}
          >
            <span className="block font-medium text-foreground">
              {reason.label}
            </span>
            <span className="mt-0.5 block text-xs text-guud-text-muted-2">
              반영: {reason.engine_effect} — {reason.effect_desc}
            </span>
          </button>
        ))}
      </div>

      {selected === "기타" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="decline-note" className="sr-only">
            기타 사유 한 줄
          </label>
          <input
            id="decline-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="한 줄로 남겨주세요"
            className="flex-1 border border-input bg-background px-3 py-2 text-sm"
          />
          <Button
            size="sm"
            disabled={submitting || note.trim().length === 0}
            onClick={() => submit("기타", note.trim())}
          >
            제출
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        disabled={submitting}
      >
        취소
      </Button>
    </div>
  );
}
