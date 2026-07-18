"use client";

// ProfileConfirmStep — 스텝1(운영자 사전입력 확인·수정) + 스텝7(review 모드, 확정 요약)에서 재사용.
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a/T-009b, FR-ON-01/08
// FR-ON-01: 조직·역할·지역·분야·밸류체인·미션·신뢰연결점 7항목 전부 확인·수정 가능.
// fields.json은 비민감 시드라 컴포넌트가 직접 참조할 수 있다(ARCHITECTURE.md §2, DAL 경유 예외).

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import fieldsSeed from "@/data/fields.json";
import { cn } from "@/lib/utils";
import type { Field } from "@/types";
import {
  type OnboardingDraft,
  TRUST_CONNECTION_TYPES,
  type TrustConnectionDraft,
} from "./onboarding-draft";

const fields = fieldsSeed as Field[];

export function ProfileConfirmStep({
  draft,
  onChange,
  mode = "edit",
}: {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  /** edit: 스텝1 수정 폼. review: 스텝7 확정 요약(읽기전용 + 재수정 진입은 이전 스텝으로). */
  mode?: "edit" | "review";
}) {
  const orgNameId = useId();
  const orgTypeId = useId();
  const orgRoleId = useId();
  const sidoId = useId();
  const sigunguId = useId();
  const stageId = useId();
  const missionId = useId();

  function toggleField(fieldId: number) {
    const next = draft.fieldTags.includes(fieldId)
      ? draft.fieldTags.filter((id) => id !== fieldId)
      : [...draft.fieldTags, fieldId];
    onChange({ fieldTags: next });
  }

  function updateTrustConnection(
    index: number,
    patch: Partial<TrustConnectionDraft>,
  ) {
    const next = draft.trustConnections.map((tc, i) =>
      i === index ? { ...tc, ...patch } : tc,
    );
    onChange({ trustConnections: next });
  }

  function addTrustConnection() {
    onChange({
      trustConnections: [
        ...draft.trustConnections,
        { type: "아는회원", ref: "" },
      ],
    });
  }

  function removeTrustConnection(index: number) {
    onChange({
      trustConnections: draft.trustConnections.filter((_, i) => i !== index),
    });
  }

  if (mode === "review") {
    const fieldNames = draft.fieldTags
      .map((id) => fields.find((f) => f.id === id)?.name ?? `#${id}`)
      .join(", ");
    return (
      <div className="space-y-3 text-sm">
        <dl className="grid grid-cols-[7rem_1fr] gap-y-2">
          <dt className="text-guud-text-muted-2">조직</dt>
          <dd className="text-foreground">
            {draft.orgName} · {draft.orgType} · {draft.orgRole}
          </dd>
          <dt className="text-guud-text-muted-2">지역</dt>
          <dd className="text-foreground">
            {draft.sido} {draft.sigungu}
          </dd>
          <dt className="text-guud-text-muted-2">분야</dt>
          <dd className="text-foreground">{fieldNames || "미선택"}</dd>
          <dt className="text-guud-text-muted-2">밸류체인 단계</dt>
          <dd className="text-foreground">{draft.valueChainStage}</dd>
          <dt className="text-guud-text-muted-2">미션</dt>
          <dd className="text-foreground">{draft.missionStatement}</dd>
          <dt className="text-guud-text-muted-2">신뢰 연결점</dt>
          <dd className="text-foreground">
            {draft.trustConnections.length > 0
              ? draft.trustConnections
                  .map((tc) => `${tc.type}: ${tc.ref}`)
                  .join(" / ")
              : "없음"}
          </dd>
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-guud-text-muted-2">
        운영자가 미리 입력한 프로필이에요. 틀린 부분이 있으면 바로 고쳐주세요.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={orgNameId}>조직명</Label>
          <Input
            id={orgNameId}
            value={draft.orgName}
            onChange={(e) => onChange({ orgName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={orgTypeId}>조직 유형</Label>
          <Input
            id={orgTypeId}
            value={draft.orgType}
            onChange={(e) => onChange({ orgType: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={orgRoleId}>역할(직책)</Label>
          <Input
            id={orgRoleId}
            value={draft.orgRole}
            onChange={(e) => onChange({ orgRole: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={sidoId}>시/도</Label>
          <Input
            id={sidoId}
            value={draft.sido}
            onChange={(e) => onChange({ sido: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={sigunguId}>시/군/구</Label>
          <Input
            id={sigunguId}
            value={draft.sigungu}
            onChange={(e) => onChange({ sigungu: e.target.value })}
          />
        </div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-foreground">분야</legend>
        <div className="flex flex-wrap gap-2">
          {fields.map((field) => {
            const active = draft.fieldTags.includes(field.id);
            return (
              <button
                key={field.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleField(field.id)}
                className={cn(
                  // 모드 B 회송: 터치 타깃 44px 미만(26px) — min-h-11 + inline-flex로 확보
                  "inline-flex min-h-11 items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-guud-text-muted-2 hover:text-foreground",
                )}
              >
                {field.name}
                {field.is_extension && (
                  <span className="ml-1 text-[10px] opacity-70">확장</span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor={stageId}>밸류체인 단계</Label>
        <Input
          id={stageId}
          value={draft.valueChainStage}
          onChange={(e) => onChange({ valueChainStage: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={missionId}>미션 문장</Label>
        <Textarea
          id={missionId}
          rows={2}
          value={draft.missionStatement}
          onChange={(e) => onChange({ missionStatement: e.target.value })}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          신뢰 연결점
        </legend>
        {draft.trustConnections.map((tc, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 순서 변경 없는 편집 목록이라 인덱스 키로 충분
          <div key={index} className="flex flex-wrap items-center gap-2">
            <Select
              value={tc.type}
              onValueChange={(value) =>
                updateTrustConnection(index, {
                  type: value as TrustConnectionDraft["type"],
                })
              }
            >
              <SelectTrigger size="sm" className="w-auto text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRUST_CONNECTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={tc.ref}
              onChange={(e) =>
                updateTrustConnection(index, { ref: e.target.value })
              }
              placeholder="예: LH 매입임대 담당"
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => removeTrustConnection(index)}
            >
              삭제
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTrustConnection}
        >
          + 신뢰 연결점 추가
        </Button>
      </fieldset>
    </div>
  );
}
