"use client";

// SupplySelectStep — 12태그 중 공급 정확히 3개 선택 + 짧은 설명(FR-ON-03).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a
// 태그 선택 카드(pill 토글). 선택된 태그만 상세 설명 입력란이 열린다(공개 프로필 supply_tags.detail).

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";
import type { OnboardingDraft, SupplySelection } from "./onboarding-draft";

const REQUIRED_COUNT = 3;

export function SupplySelectStep({
  tags,
  draft,
  onChange,
}: {
  tags: Tag[];
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
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
    <div className="space-y-4">
      <p className="text-sm text-guud-text-muted-2">
        다른 회원에게 내어줄 수 있는 것 3가지를 골라주세요. 공개 프로필에 그대로
        노출돼요.
      </p>
      <p className="text-xs font-semibold text-guud-text-muted-2">
        {selections.length}/{REQUIRED_COUNT}개 선택됨
      </p>

      <ul className="grid gap-2 sm:grid-cols-2">
        {tags.map((tag) => {
          const selection = selections.find((s) => s.tagId === tag.id);
          const active = Boolean(selection);
          const disabled = !active && selections.length >= REQUIRED_COUNT;
          return (
            <li key={tag.id} className="sm:col-span-1">
              <div
                className={cn(
                  "border p-3 transition-colors",
                  active
                    ? "border-primary bg-muted"
                    : "border-border bg-background",
                  disabled && "opacity-50",
                )}
              >
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => toggleTag(tag.id)}
                  className="block w-full text-left disabled:cursor-not-allowed"
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {tag.name}
                  </span>
                  <span className="block text-xs text-guud-text-muted-2">
                    {tag.supply_desc}
                  </span>
                </button>
                {active && (
                  <Textarea
                    aria-label={`${tag.name} 공급 상세`}
                    rows={2}
                    value={selection?.detail ?? ""}
                    onChange={(e) => setDetail(tag.id, e.target.value)}
                    placeholder="구체적으로 무엇을 줄 수 있는지 짧게 적어주세요"
                    className="mt-2"
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
