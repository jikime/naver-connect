"use client";

// MeetingOutcomeForm — [만나볼래요] 이후 만남 후기(성사 여부·재만남 의향·메모) 수집.
// 근거: ARCHITECTURE.md §5.3(submitMeetingOutcome), TASKS.md T-014, FR-FB-04

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitMeetingOutcome } from "@/lib/dal";
import { cn } from "@/lib/utils";
import type { ViewerContext } from "@/types";

export function MeetingOutcomeForm({
  vc,
  recId,
  onSubmitted,
  onCancel,
}: {
  vc: ViewerContext;
  recId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [met, setMet] = useState<boolean | null>(null);
  const [willMeetAgain, setWillMeetAgain] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = met !== null && willMeetAgain !== null;

  async function handleSubmit() {
    if (met === null || willMeetAgain === null) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitMeetingOutcome(vc, recId, {
        met,
        will_meet_again: willMeetAgain,
        note,
      });
      onSubmitted();
    } catch {
      setError("본인에게 온 추천만 반응할 수 있어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 border border-guud-hairline bg-muted p-4">
      <p className="text-sm font-semibold text-foreground">
        만남은 어땠나요? 후기를 남겨주세요.
      </p>

      <fieldset className="space-y-1.5">
        <legend className="text-xs font-semibold text-guud-text-muted-2">
          만남이 성사됐나요?
        </legend>
        <div className="flex gap-2">
          {[
            { label: "성사됐어요", value: true },
            { label: "아직이에요", value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={met === opt.value}
              onClick={() => setMet(opt.value)}
              className={cn(
                "border px-3 py-1.5 text-sm",
                met === opt.value
                  ? "border-foreground bg-background font-semibold"
                  : "border-border bg-background text-guud-text-muted-2",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-1.5">
        <legend className="text-xs font-semibold text-guud-text-muted-2">
          다시 만날 의향이 있나요?
        </legend>
        <div className="flex gap-2">
          {[
            { label: "있어요", value: true },
            { label: "없어요", value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={willMeetAgain === opt.value}
              onClick={() => setWillMeetAgain(opt.value)}
              className={cn(
                "border px-3 py-1.5 text-sm",
                willMeetAgain === opt.value
                  ? "border-foreground bg-background font-semibold"
                  : "border-border bg-background text-guud-text-muted-2",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="meeting-note"
          className="mb-1 block text-xs font-semibold text-guud-text-muted-2"
        >
          메모(선택)
        </label>
        <textarea
          id="meeting-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          후기 남기기
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
