"use client";

// CollaborationTraitsStep — 협력성향 4문항: 관심활동(복수)·가용시간·선호방식·협업준비도(FR-ON-04).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a
// 협업준비도='구체적 프로젝트 있음' 선택 시 셸(OnbWizard)이 hot_lead 플래그를 세워 스텝6 분기로 전달한다.

import { cn } from "@/lib/utils";
import {
  ACTIVITY_OPTIONS,
  AVAILABILITY_OPTIONS,
  type OnboardingDraft,
  PREFERRED_MODE_OPTIONS,
  READINESS_OPTIONS,
} from "./onboarding-draft";

function ChipGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-guud-text-muted-2 hover:text-foreground",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CollaborationTraitsStep({
  draft,
  onChange,
}: {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
}) {
  function toggleActivity(value: string) {
    const next = draft.activities.includes(value)
      ? draft.activities.filter((a) => a !== value)
      : [...draft.activities, value];
    onChange({ activities: next });
  }

  return (
    <div className="space-y-6">
      <ChipGroup
        legend="관심 활동(복수 선택 가능)"
        options={ACTIVITY_OPTIONS}
        selected={draft.activities}
        onToggle={toggleActivity}
      />
      <ChipGroup
        legend="가용 시간"
        options={AVAILABILITY_OPTIONS}
        selected={draft.availability ? [draft.availability] : []}
        onToggle={(value) => onChange({ availability: value })}
      />
      <ChipGroup
        legend="선호 방식"
        options={PREFERRED_MODE_OPTIONS}
        selected={draft.preferredMode ? [draft.preferredMode] : []}
        onToggle={(value) => onChange({ preferredMode: value })}
      />
      <ChipGroup
        legend="협업 준비도"
        options={READINESS_OPTIONS}
        selected={draft.readiness ? [draft.readiness] : []}
        onToggle={(value) => onChange({ readiness: value })}
      />
    </div>
  );
}
