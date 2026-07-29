"use client";

// DemandSelectStep — 12태그 중 수요 1~3개 + 최우선 ★1 선택(FR-ON-02).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a
// 태그 선택 카드(pill 토글) + 별표 최우선 표시. 1~3개 범위와 최우선 지정은 셸이 검증한다.

import { Check, EyeOff, Star } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { MemberType, Tag } from "@/types";
import type { DemandSelection, OnboardingDraft } from "./onboarding-draft";

const REQUIRED_COUNT = 3;

export function DemandSelectStep({
  tags,
  draft,
  onChange,
  memberType,
}: {
  tags: Tag[];
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  memberType: MemberType;
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl bg-muted p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm leading-6 text-foreground">
            {memberType === "전문가"
              ? "이 네트워크에서 얻고 싶은 것을 1~3개 골라주세요. 전문가도 얻어가는 것이 있어야 건강한 연결이 됩니다."
              : "지금 우리 조직에 가장 필요한 것을 1~3개 골라주세요."}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-guud-text-muted-2">
            <EyeOff className="size-3.5" /> 선택 내용은 공개 프로필에 표시되지
            않아요.
          </p>
        </div>
        <div
          aria-live="polite"
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full bg-background px-3 py-2 text-xs font-semibold",
            selections.length >= 1 && hasPriority
              ? "text-primary"
              : "text-guud-text-muted-2",
          )}
        >
          {selections.length >= 1 && hasPriority && (
            <Check className="size-3.5" />
          )}
          {selections.length}/{REQUIRED_COUNT} 선택
        </div>
      </div>

      <p className="text-xs leading-5 text-guud-text-muted-2">
        한 가지 이상(최대 3) 고르고, 가장 급한 항목 하나에 별표를 지정해주세요.
        {selections.length >= 1 &&
          !hasPriority &&
          " 최우선 하나에 별표를 눌러주세요."}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {tags.map((tag, index) => {
          const selection = selections.find((s) => s.tagId === tag.id);
          const active = Boolean(selection);
          const disabled = !active && selections.length >= REQUIRED_COUNT;
          return (
            <li key={tag.id}>
              <div
                className={cn(
                  "flex min-h-32 items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-primary bg-secondary/50 shadow-sm"
                    : "border-guud-hairline bg-background hover:border-primary/40 hover:bg-muted/50",
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
                  className="flex min-w-0 flex-1 gap-3 text-left disabled:cursor-not-allowed"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.625rem] font-semibold",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-guud-hairline text-guud-text-muted-2",
                    )}
                  >
                    {active ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {tag.name}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-guud-text-muted-2">
                      {tag.demand_desc}
                    </span>
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
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[0.625rem] font-semibold",
                      selection?.priority
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-guud-text-muted-2",
                    )}
                  >
                    <Star
                      className={cn(
                        "size-3.5",
                        selection?.priority && "fill-current",
                      )}
                    />
                    {selection?.priority ? "가장 급함" : "우선순위"}
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
