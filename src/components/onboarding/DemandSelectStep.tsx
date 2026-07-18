"use client";

// DemandSelectStep — 12태그 중 수요 정확히 3개 + 최우선 ★1 선택(FR-ON-02).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a
// 태그 선택 카드(pill 토글) + 별표 최우선 표시. 정확히 3개 미만/초과, 최우선 미지정 시 다음 버튼 비활성(셸이 검증).

import { Star } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";
import type { DemandSelection, OnboardingDraft } from "./onboarding-draft";

const REQUIRED_COUNT = 3;

export function DemandSelectStep({
  tags,
  draft,
  onChange,
}: {
  tags: Tag[];
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
}) {
  const selections = draft.demandSelections;
  const selectedIds = new Set(selections.map((s) => s.tagId));

  function toggleTag(tagId: number) {
    if (selectedIds.has(tagId)) {
      onChange({
        demandSelections: selections.filter((s) => s.tagId !== tagId),
      });
      return;
    }
    if (selections.length >= REQUIRED_COUNT) {
      return;
    }
    const next: DemandSelection[] = [
      ...selections,
      { tagId, priority: selections.length === 0 },
    ];
    onChange({ demandSelections: next });
  }

  function setPriority(tagId: number) {
    onChange({
      demandSelections: selections.map((s) => ({
        ...s,
        priority: s.tagId === tagId,
      })),
    });
  }

  const hasPriority = selections.some((s) => s.priority);

  return (
    <div className="space-y-4">
      <p className="text-sm text-guud-text-muted-2">
        지금 가장 아쉬운 것 3가지를 골라주세요. 그중 가장 급한 하나에{" "}
        <Star className="inline size-3.5 align-text-bottom" aria-hidden />{" "}
        별표를 눌러주세요.
      </p>
      <p
        aria-live="polite"
        className={cn(
          "text-xs font-semibold",
          selections.length === REQUIRED_COUNT && hasPriority
            ? "text-foreground"
            : "text-guud-text-muted-2",
        )}
      >
        {selections.length}/{REQUIRED_COUNT}개 선택됨
        {selections.length === REQUIRED_COUNT &&
          !hasPriority &&
          " · 최우선 하나에 별표를 눌러주세요"}
      </p>

      <ul className="grid gap-2 sm:grid-cols-2">
        {tags.map((tag) => {
          const selection = selections.find((s) => s.tagId === tag.id);
          const active = Boolean(selection);
          const disabled = !active && selections.length >= REQUIRED_COUNT;
          return (
            <li key={tag.id}>
              <div
                className={cn(
                  "flex items-start gap-2 border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-muted"
                    : "border-border bg-background",
                  disabled && "opacity-50",
                )}
              >
                <motion.button
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => toggleTag(tag.id)}
                  whileTap={disabled ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 text-left disabled:cursor-not-allowed"
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {tag.name}
                  </span>
                  <span className="block text-xs text-guud-text-muted-2">
                    {tag.demand_desc}
                  </span>
                </motion.button>
                {active && (
                  <motion.button
                    type="button"
                    aria-pressed={selection?.priority ?? false}
                    aria-label={`${tag.name} 최우선으로 지정`}
                    onClick={() => setPriority(tag.id)}
                    whileTap={{ scale: 0.85 }}
                    transition={{ duration: 0.1 }}
                    className="shrink-0 p-1"
                  >
                    <Star
                      className={cn(
                        "size-5",
                        selection?.priority
                          ? "fill-destructive text-destructive"
                          : "text-guud-text-faint",
                      )}
                    />
                  </motion.button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
