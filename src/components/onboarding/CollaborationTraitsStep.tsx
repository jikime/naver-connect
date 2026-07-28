"use client";

// CollaborationTraitsStep — 협력성향 4문항: 관심활동(복수)·가용시간·선호방식·협업준비도(FR-ON-04).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a
// 협업준비도='구체적 프로젝트 있음' 선택 시 셸(OnbWizard)이 hot_lead 플래그를 세워 스텝6 분기로 전달한다.
//
// 가용시간·선호방식·협업준비도는 단일 선택이라 shadcn RadioGroup(role=radio, 화살표 키 이동,
// 단일선택 보장)으로 전환했다(Task #16). 시각은 guud filter-chip-selected(pill, 채움 배경) 그대로
// 유지 — RadioGroupItem에 children을 넘기면 기본 원형 라디오닷 대신 그 내용을 렌더한다(ui/radio-group.tsx).
// 관심 활동은 복수 선택이라 라디오 시맨틱이 맞지 않아 기존 토글 버튼 그룹을 유지한다.

import {
  CalendarClock,
  Handshake,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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
  description,
}: {
  legend: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  description: string;
}) {
  return (
    <fieldset className="rounded-2xl border border-guud-hairline bg-background p-5">
      <legend className="px-1 text-sm font-semibold text-foreground">
        {legend}
      </legend>
      <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
        {description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={cn(
                // modoomat tab-selected 어휘: 선택=secondary 면, 비선택=투명+muted-fg
                "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-guud-hairline bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
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
  description,
  icon: Icon,
}: {
  legend: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  description: string;
  icon: typeof CalendarClock;
}) {
  return (
    <fieldset className="rounded-2xl border border-guud-hairline bg-background p-5">
      <legend className="px-1 text-sm font-semibold text-foreground">
        {legend}
      </legend>
      <div className="mt-1 flex items-start gap-2 text-xs leading-5 text-guud-text-muted-2">
        <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p>{description}</p>
      </div>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="mt-4 flex w-auto flex-row flex-wrap gap-2"
      >
        {options.map((option) => {
          const active = value === option;
          return (
            <RadioGroupItem
              key={option}
              value={option}
              className={cn(
                // modoomat tab-selected 어휘: 선택=secondary 면, 비선택=투명+muted-fg
                "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-guud-hairline bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
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
  isExpert,
  requiresParticipationScope,
}: {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  isExpert: boolean;
  requiresParticipationScope: boolean;
}) {
  function toggleActivity(value: string) {
    const next = draft.activities.includes(value)
      ? draft.activities.filter((a) => a !== value)
      : [...draft.activities, value];
    onChange({ activities: next });
  }

  const activityOptions = isExpert
    ? [...ACTIVITY_OPTIONS, "프로보노 자문"]
    : ACTIVITY_OPTIONS;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <ChipGroup
          legend="관심 활동"
          description={
            isExpert
              ? "참여하고 싶은 활동을 모두 골라주세요. 프로보노 자문도 선택할 수 있어요."
              : "부담 없이 참여하고 싶은 활동을 모두 골라주세요."
          }
          options={activityOptions}
          selected={draft.activities}
          onToggle={toggleActivity}
        />
      </div>
      <RadioChipGroup
        legend="낼 수 있는 시간"
        description="추천 빈도와 모임 제안을 조절하는 기준이에요."
        icon={CalendarClock}
        options={AVAILABILITY_OPTIONS}
        value={draft.availability}
        onChange={(value) => onChange({ availability: value })}
      />
      <RadioChipGroup
        legend="선호 방식"
        description="온라인과 오프라인 중 더 편안한 방식을 골라주세요."
        icon={MapPin}
        options={PREFERRED_MODE_OPTIONS}
        value={draft.preferredMode}
        onChange={(value) => onChange({ preferredMode: value })}
      />
      <div className="sm:col-span-2">
        <RadioChipGroup
          legend="협업 준비도"
          description="구체적인 프로젝트가 있다면 추가 질문으로 필요한 파트너까지 정리해드려요."
          icon={isExpert ? Sparkles : Handshake}
          options={READINESS_OPTIONS}
          value={draft.readiness}
          onChange={(value) => onChange({ readiness: value })}
        />
      </div>
      {requiresParticipationScope && (
        <div className="sm:col-span-2">
          <RadioChipGroup
            legend="참여 자격"
            description="기관의 이해관계와 개인의 네트워크 활동을 구분해 공정한 추천을 만들어요."
            icon={ShieldCheck}
            options={["개인 자격으로 참여", "소속 기관을 대표해 참여"]}
            value={draft.participationScope}
            onChange={(value) =>
              onChange({
                participationScope:
                  value as OnboardingDraft["participationScope"],
              })
            }
          />
        </div>
      )}
    </div>
  );
}
