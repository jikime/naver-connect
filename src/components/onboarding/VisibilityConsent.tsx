"use client";

// VisibilityConsent — 스텝7 동의(FR-ON-08). M1: 단일 체크박스 → 목적별 3분리.
// A 공개 프로필 노출(필수) / B 비공개 수요의 매칭 사용(권장) / C 소개 시 원문 인용(선택).
// B 미동의 시 공개층만으로 추천되어 품질이 제한됨을 고지한다(research_synthesis §11).
// 근거: TASKS.md T-009b, plans/generic-mixing-seahorse.md M1-8

import { Eye, LockKeyhole, Quote, ShieldCheck } from "lucide-react";
import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface ConsentState {
  publish: boolean;
  matching: boolean;
  quote: boolean;
}

const CONSENT_ITEMS = [
  {
    key: "publish" as const,
    icon: Eye,
    title: "공개 프로필 노출 동의 (필수)",
    desc: "나눌 수 있는 것·활동 선호·지역을 전체 회원에게 공개합니다.",
  },
  {
    key: "matching" as const,
    icon: LockKeyhole,
    title: "비공개 정보의 매칭 사용 동의 (권장)",
    desc: "필요한 연결·프로젝트·가용시간을 추천 엔진에만 사용합니다. 동의하지 않으면 공개 정보만으로 추천되어 정확도가 낮아져요.",
  },
  {
    key: "quote" as const,
    icon: Quote,
    title: "소개 시 원문 인용 동의 (선택)",
    desc: "동의하지 않으면 소개 메시지에 원문 대신 최소 요약만 전달됩니다.",
  },
];

export function VisibilityConsent({
  consents,
  onChange,
}: {
  consents: ConsentState;
  onChange: (patch: Partial<ConsentState>) => void;
}) {
  const baseId = useId();
  return (
    <div className="rounded-2xl border border-guud-hairline p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">
          정보 사용 범위를 목적별로 선택해주세요
        </p>
      </div>
      <ul className="mt-4 space-y-3">
        {CONSENT_ITEMS.map((item) => {
          const Icon = item.icon;
          const id = `${baseId}-${item.key}`;
          return (
            <li
              key={item.key}
              className="flex items-start gap-3 rounded-xl bg-muted p-4"
            >
              <Checkbox
                id={id}
                checked={consents[item.key]}
                onCheckedChange={(value) =>
                  onChange({ [item.key]: value === true })
                }
                className="mt-0.5"
              />
              <div className="min-w-0">
                <Label
                  htmlFor={id}
                  className="flex items-center gap-1.5 text-sm font-semibold"
                >
                  <Icon className="size-3.5 shrink-0 text-primary" />
                  {item.title}
                </Label>
                <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
                  {item.desc}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs leading-5 text-guud-text-muted-2">
        확정 전까지 입력 내용은 매칭에 사용되지 않으며, 동의는 언제든 철회할 수
        있어요.
      </p>
    </div>
  );
}
