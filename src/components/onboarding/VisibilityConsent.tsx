"use client";

// VisibilityConsent — 스텝7 동의(FR-ON-08). M1: 단일 체크박스 → 목적별 3분리.
// A 공개 프로필 노출(필수) / B 비공개 수요의 매칭 사용(권장) / C 소개 시 원문 인용(선택).
// B 미동의 시 공개층만으로 추천되어 품질이 제한됨을 고지한다(research_synthesis §11).
// M2 P1-1: B 동의 시 수요별 매칭용 문구를 본인이 확인·수정·승인하는 섹션 추가 —
// 여기서는 승인 의사와 문구만 수집하고, 영수증은 서버가 발급한다(Codex 보완 #1).
// 근거: TASKS.md T-009b, plans/generic-mixing-seahorse.md M1-8, m2-onboarding-scope-reply #1

import { Eye, LockKeyhole, Quote, ShieldCheck } from "lucide-react";
import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ConsentState {
  publish: boolean;
  matching: boolean;
  quote: boolean;
}

export interface SafeMatchApprovalItem {
  tagId: number;
  tagName: string;
  /** 온보딩에서 수집한 원문(detail_quote) — 승인 문구의 기본값 */
  quote: string;
  approved: boolean;
  text: string;
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
  safeMatchItems = [],
  onSafeMatchChange,
}: {
  consents: ConsentState;
  onChange: (patch: Partial<ConsentState>) => void;
  /** B 동의 시 승인 대상 수요 문구 목록(원문 있는 항목만) */
  safeMatchItems?: SafeMatchApprovalItem[];
  onSafeMatchChange?: (
    tagId: number,
    patch: Partial<{ approved: boolean; text: string }>,
  ) => void;
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
      {consents.matching && safeMatchItems.length > 0 && (
        <div className="mt-4 rounded-xl border border-guud-hairline p-4">
          <p className="text-sm font-semibold text-foreground">
            매칭에 사용할 문구를 확인해주세요
          </p>
          <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
            승인한 문구만 추천 엔진이 사용해요. 원문은 공개되지 않고, 승인
            전에는 키워드로만 매칭돼요.
          </p>
          <ul className="mt-3 space-y-3">
            {safeMatchItems.map((item) => {
              const id = `${baseId}-safe-${item.tagId}`;
              return (
                <li key={item.tagId} className="rounded-xl bg-muted p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={id}
                      checked={item.approved}
                      onCheckedChange={(value) =>
                        onSafeMatchChange?.(item.tagId, {
                          approved: value === true,
                        })
                      }
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <Label htmlFor={id} className="text-sm font-semibold">
                        {item.tagName} — 이 문구로 매칭에 사용할게요
                      </Label>
                      <Textarea
                        value={item.text}
                        onChange={(e) =>
                          onSafeMatchChange?.(item.tagId, {
                            text: e.target.value,
                          })
                        }
                        rows={2}
                        className="mt-2 text-sm"
                        aria-label={`${item.tagName} 매칭용 문구`}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs leading-5 text-guud-text-muted-2">
        확정 전까지 입력 내용은 매칭에 사용되지 않으며, 동의는 언제든 철회할 수
        있어요.
      </p>
    </div>
  );
}
