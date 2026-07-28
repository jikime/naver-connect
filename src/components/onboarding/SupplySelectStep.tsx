"use client";

// SupplySelectStep — 12태그 중 공급 정확히 3개 선택 + 짧은 설명(FR-ON-03).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a
// 태그 선택 카드(pill 토글). 선택된 태그만 상세 설명 입력란이 열린다(공개 프로필 supply_tags.detail).

import { Check, Eye, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MemberType, Tag } from "@/types";
import type { OnboardingDraft, SupplySelection } from "./onboarding-draft";

const REQUIRED_COUNT = 3;

export function SupplySelectStep({
  tags,
  draft,
  onChange,
  memberType,
  hasPrefilledValues,
}: {
  tags: Tag[];
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  memberType: MemberType;
  hasPrefilledValues: boolean;
}) {
  const selections = draft.supplySelections;
  const selectedIds = new Set(selections.map((s) => s.tagId));

  function toggleTag(tagId: number) {
    if (selectedIds.has(tagId)) {
      onChange({
        supplySelections: selections.filter((s) => s.tagId !== tagId),
      });
      return;
    }
    if (selections.length >= REQUIRED_COUNT) {
      return;
    }
    const next: SupplySelection[] = [...selections, { tagId, detail: "" }];
    onChange({ supplySelections: next });
  }

  function setDetail(tagId: number, detail: string) {
    onChange({
      supplySelections: selections.map((s) =>
        s.tagId === tagId ? { ...s, detail } : s,
      ),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl bg-muted p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm leading-6 text-foreground">
            {memberType === "전문가"
              ? "전문 분야를 바탕으로 미리 선택해 두었어요. 맞는지 확인하고 필요한 항목을 추가해주세요."
              : "다른 회원이 나를 찾아와야 할 이유 세 가지를 골라주세요."}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-guud-text-muted-2">
            {hasPrefilledValues ? (
              <Sparkles className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            {hasPrefilledValues
              ? "기존 전문 분야를 사전 선택했습니다."
              : "선택한 내용과 설명은 공개 프로필에 표시돼요."}
          </p>
        </div>
        <div
          aria-live="polite"
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full bg-background px-3 py-2 text-xs font-semibold",
            selections.length === REQUIRED_COUNT
              ? "text-primary"
              : "text-guud-text-muted-2",
          )}
        >
          {selections.length === REQUIRED_COUNT && (
            <Check className="size-3.5" />
          )}
          {selections.length}/{REQUIRED_COUNT} 선택
        </div>
      </div>

      <p className="text-xs leading-5 text-guud-text-muted-2">
        선택한 항목마다 구체적으로 어떤 도움을 줄 수 있는지 한 문장으로
        적어주세요.
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {tags.map((tag, index) => {
          const selection = selections.find((s) => s.tagId === tag.id);
          const active = Boolean(selection);
          const disabled = !active && selections.length >= REQUIRED_COUNT;
          return (
            <li key={tag.id} className="sm:col-span-1">
              <div
                className={cn(
                  "rounded-2xl border p-4 transition-all",
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
                  className="flex min-h-20 w-full gap-3 text-left disabled:cursor-not-allowed"
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
                      {tag.supply_desc}
                    </span>
                  </span>
                </motion.button>
                {active && (
                  <Textarea
                    aria-label={`${tag.name} 공급 상세`}
                    rows={2}
                    value={selection?.detail ?? ""}
                    onChange={(e) => setDetail(tag.id, e.target.value)}
                    placeholder="구체적으로 무엇을 줄 수 있는지 짧게 적어주세요"
                    className="mt-3 bg-background"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
