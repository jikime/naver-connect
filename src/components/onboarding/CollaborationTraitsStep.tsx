"use client";

// CollaborationTraitsStep — 협력성향 4문항: 관심활동(복수)·가용시간·선호방식·협업준비도(FR-ON-04).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a
// 협업준비도='구체적 프로젝트 있음' 선택 시 셸(OnbWizard)이 hot_lead 플래그를 세워 스텝6 분기로 전달한다.
//
// 가용시간·선호방식·협업준비도는 단일 선택이라 shadcn RadioGroup(role=radio, 화살표 키 이동,
// 단일선택 보장)으로 전환했다(Task #16). 시각은 guud filter-chip-selected(pill, 채움 배경) 그대로
// 유지 — RadioGroupItem에 children을 넘기면 기본 원형 라디오닷 대신 그 내용을 렌더한다(ui/radio-group.tsx).
// 관심 활동은 복수 선택이라 라디오 시맨틱이 맞지 않아 기존 토글 버튼 그룹을 유지한다.

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
                "inline-flex min-h-11 items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
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

/** 단일 선택 협력성향 문항(가용시간·선호방식·협업준비도) — RadioGroup + pill 시각. */
function RadioChipGroup({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex w-auto flex-row flex-wrap gap-2"
      >
        {options.map((option) => {
          const active = value === option;
          return (
            <RadioGroupItem
              key={option}
              value={option}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-guud-text-muted-2 hover:text-foreground",
              )}
            >
              {option}
            </RadioGroupItem>
          );
        })}
      </RadioGroup>
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
      <RadioChipGroup
        legend="가용 시간"
        options={AVAILABILITY_OPTIONS}
        value={draft.availability}
        onChange={(value) => onChange({ availability: value })}
      />
      <RadioChipGroup
        legend="선호 방식"
        options={PREFERRED_MODE_OPTIONS}
        value={draft.preferredMode}
        onChange={(value) => onChange({ preferredMode: value })}
      />
      <RadioChipGroup
        legend="협업 준비도"
        options={READINESS_OPTIONS}
        value={draft.readiness}
        onChange={(value) => onChange({ readiness: value })}
      />
    </div>
  );
}
