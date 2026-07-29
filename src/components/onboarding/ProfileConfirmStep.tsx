"use client";

// ProfileConfirmStep — 스텝1(운영자 사전입력 확인·수정) + 스텝7(review 모드, 확정 요약)에서 재사용.
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009a/T-009b, FR-ON-01/08
// FR-ON-01: 조직·역할·지역·분야·밸류체인·미션·신뢰연결점 7항목 전부 확인·수정 가능.

import {
  Building2,
  Check,
  MapPin,
  Network,
  Plus,
  Quote,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { Field } from "@/types";
import {
  type OnboardingDraft,
  TRUST_CONNECTION_TYPES,
  type TrustConnectionDraft,
} from "./onboarding-draft";

export function ProfileConfirmStep({
  draft,
  onChange,
  fields,
  mode = "edit",
}: {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  fields: Field[];
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
    const next = draft.trustConnections.map((connection, itemIndex) =>
      itemIndex === index ? { ...connection, ...patch } : connection,
    );
    onChange({ trustConnections: next });
  }

  function addTrustConnection() {
    onChange({
      trustConnections: [
        ...draft.trustConnections,
        {
          draftId: `trust-${draft.trustConnections.length}-${Date.now()}`,
          type: "아는회원",
          ref: "",
        },
      ],
    });
  }

  function removeTrustConnection(index: number) {
    onChange({
      trustConnections: draft.trustConnections.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    });
  }

  if (mode === "review") {
    const fieldNames = draft.fieldTags
      .map((id) => fields.find((field) => field.id === id)?.name ?? `#${id}`)
      .join(", ");

    return (
      <section className="overflow-hidden rounded-2xl border border-guud-hairline">
        <div className="bg-muted p-5 sm:p-6">
          <p className="font-mono text-[0.625rem] tracking-[0.14em] text-guud-text-muted-2 uppercase">
            [ PROFILE SUMMARY ]
          </p>
          <blockquote className="mt-3 flex gap-3 font-heading text-lg leading-8 font-medium text-foreground sm:text-xl">
            <Quote className="mt-1 size-5 shrink-0 text-primary" />
            <p>{draft.missionStatement}</p>
          </blockquote>
        </div>
        <dl className="grid gap-px bg-guud-hairline sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-background p-4">
            <dt className="flex items-center gap-2 text-xs text-guud-text-muted-2">
              <Building2 className="size-3.5 text-primary" /> 조직
            </dt>
            <dd className="mt-2 text-sm font-semibold text-foreground">
              {draft.orgName}
            </dd>
            <dd className="mt-1 text-xs text-guud-text-muted-2">
              {draft.orgType} · {draft.orgRole}
            </dd>
          </div>
          <div className="bg-background p-4">
            <dt className="flex items-center gap-2 text-xs text-guud-text-muted-2">
              <MapPin className="size-3.5 text-primary" /> 지역
            </dt>
            <dd className="mt-2 text-sm font-semibold text-foreground">
              {draft.sido} {draft.sigungu}
            </dd>
          </div>
          <div className="bg-background p-4">
            <dt className="flex items-center gap-2 text-xs text-guud-text-muted-2">
              <Network className="size-3.5 text-primary" /> 분야·밸류체인
            </dt>
            <dd className="mt-2 text-sm font-semibold text-foreground">
              {fieldNames || "미선택"}
            </dd>
            <dd className="mt-1 text-xs text-guud-text-muted-2">
              {draft.valueChainStage}
            </dd>
          </div>
          <div className="bg-background p-4">
            <dt className="flex items-center gap-2 text-xs text-guud-text-muted-2">
              <ShieldCheck className="size-3.5 text-primary" /> 신뢰 연결점
            </dt>
            <dd className="mt-2 text-sm leading-5 font-semibold text-foreground">
              {draft.trustConnections.length > 0
                ? draft.trustConnections
                    .map((connection) => connection.ref)
                    .join(" · ")
                : "없음"}
            </dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl bg-secondary/70 p-4 text-sm leading-6 text-foreground">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" />
        </span>
        <p>
          네트워크가 이미 알고 있는 정보를 정리했어요. 맞는 내용은 그대로 두고,
          달라진 부분만 고쳐주세요.
        </p>
      </div>

      <section className="rounded-2xl border border-guud-hairline p-5">
        <div className="flex items-center gap-3 border-b border-guud-hairline pb-4">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-primary">
            <Building2 className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              조직과 역할
            </h3>
            <p className="mt-0.5 text-xs text-guud-text-muted-2">
              현재 가장 주된 소속을 기준으로 적어주세요.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor={orgNameId}>조직명</Label>
            <Input
              id={orgNameId}
              value={draft.orgName}
              onChange={(event) => onChange({ orgName: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={orgTypeId}>조직 유형</Label>
            <Input
              id={orgTypeId}
              value={draft.orgType}
              onChange={(event) => onChange({ orgType: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={orgRoleId}>역할(직책)</Label>
            <Input
              id={orgRoleId}
              value={draft.orgRole}
              onChange={(event) => onChange({ orgRole: event.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-guud-hairline p-5">
        <div className="flex items-center gap-3 border-b border-guud-hairline pb-4">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-primary">
            <MapPin className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              활동 지역과 분야
            </h3>
            <p className="mt-0.5 text-xs text-guud-text-muted-2">
              가까운 지역과 같은 가치사슬의 연결을 찾는 기준이에요.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={sidoId}>시/도</Label>
            <Input
              id={sidoId}
              value={draft.sido}
              onChange={(event) => onChange({ sido: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={sigunguId}>시/군/구</Label>
            <Input
              id={sigunguId}
              value={draft.sigungu}
              onChange={(event) => onChange({ sigungu: event.target.value })}
            />
          </div>
        </div>
        <fieldset className="mt-5 space-y-2">
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
                    "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-guud-hairline bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
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
        <div className="mt-5 space-y-1.5">
          <Label htmlFor={stageId}>밸류체인 단계</Label>
          <Input
            id={stageId}
            value={draft.valueChainStage}
            onChange={(event) =>
              onChange({ valueChainStage: event.target.value })
            }
            placeholder="예: 서비스 제공, 유통, 중간지원"
          />
        </div>
      </section>

      <section className="rounded-2xl bg-foreground p-5 text-background sm:p-6">
        <Label htmlFor={missionId} className="text-background/70">
          왜 이 일을 하나요?
        </Label>
        <Textarea
          id={missionId}
          rows={3}
          value={draft.missionStatement}
          onChange={(event) =>
            onChange({ missionStatement: event.target.value })
          }
          className="mt-2 border-background/20 bg-background/10 font-heading text-base leading-7 text-background placeholder:text-background/35"
          placeholder="내가 해결하고 싶은 문제와 바라는 변화를 한두 문장으로 적어주세요."
        />
        <p className="mt-2 text-xs text-background/50">
          미션 문장은 공개 프로필의 가장 중요한 소개가 됩니다.
        </p>
      </section>

      <fieldset className="rounded-2xl border border-guud-hairline p-5">
        <legend className="px-1 text-sm font-semibold text-foreground">
          신뢰 연결점
        </legend>
        <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
          소개자나 이미 아는 회원, 함께 활동하는 모임을 적어주세요.
        </p>
        <div className="mt-4 space-y-3">
          {draft.trustConnections.map((connection, index) => (
            <div
              key={connection.draftId}
              className="flex flex-col gap-2 rounded-xl bg-muted p-3 sm:flex-row sm:items-center"
            >
              <Select
                value={connection.type}
                onValueChange={(value) =>
                  updateTrustConnection(index, {
                    type: value as TrustConnectionDraft["type"],
                  })
                }
              >
                <SelectTrigger
                  size="sm"
                  className="w-full bg-background text-xs sm:w-auto"
                >
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
                value={connection.ref}
                onChange={(event) =>
                  updateTrustConnection(index, { ref: event.target.value })
                }
                placeholder="예: LH 매입임대 담당"
                className="flex-1 bg-background"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeTrustConnection(index)}
                aria-label={`${connection.ref || "신뢰 연결점"} 삭제`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTrustConnection}
          className="mt-3"
        >
          <Plus className="size-4" /> 신뢰 연결점 추가
        </Button>
      </fieldset>
    </div>
  );
}
