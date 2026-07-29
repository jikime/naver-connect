// /onboarding — 온보딩 위저드 라우트. 정적 셸은 Server Component, 위저드 본문은 Client(ADR-04).
// 근거: TASKS.md T-009a/T-009b, FR-ON-01~11, FR-GL-04(전역 네비 첫 진입 순서)

import { CheckCircle2, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { OnbWizard } from "@/components/onboarding/OnbWizard";

export const metadata: Metadata = {
  title: "온보딩 | 사회혁신기업가네트워크 AX 플랫폼",
};

export default function OnboardingPage() {
  return (
    <div className="flex-1 bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] bg-foreground text-background shadow-sm">
          <div className="grid lg:grid-cols-[0.86fr_1.14fr]">
            <div className="flex flex-col justify-between gap-10 p-7 sm:p-10 lg:p-12">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-2 text-xs font-semibold text-background/85">
                    <Clock3 className="size-3.5 text-primary" /> 약 5~7분
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-2 text-xs font-semibold text-background/85">
                    <Sparkles className="size-3.5 text-primary" /> 완료 즉시 첫
                    추천
                  </span>
                </div>
                <p className="mt-8 font-mono text-[0.625rem] font-medium tracking-[0.16em] text-primary uppercase">
                  [ START WITH YOUR STORY ]
                </p>
                <h1 className="mt-3 max-w-xl font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  좋은 추천은,
                  <br />
                  나를 잘 설명하는 것부터
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-background/65 sm:text-base">
                  이미 알고 있는 정보는 확인만 하고, 필요한 것과 나눌 수 있는
                  것을 짧게 알려주세요. 첫 연결의 이유가 더 선명해집니다.
                </p>
              </div>

              <ul className="grid gap-3 text-sm text-background/80 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  사전 입력 프로필
                </li>
                <li className="flex items-center gap-2">
                  <LockKeyhole className="size-4 shrink-0 text-primary" />
                  수요 정보 비공개
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="size-4 shrink-0 text-primary" />첫 추천
                  3건 제공
                </li>
              </ul>
            </div>

            <figure className="relative min-h-72 overflow-hidden bg-[#f1ece2] sm:min-h-96 lg:min-h-full">
              <Image
                src="/images/onboarding-journey-cover.webp"
                alt="프로필 확인부터 필요한 연결과 나눌 역량을 정리해 첫 만남으로 이어지는 온보딩 여정"
                fill
                sizes="(max-width: 1023px) 100vw, 58vw"
                className="object-cover"
                preload
              />
            </figure>
          </div>
        </section>

        <OnbWizard />
      </div>
    </div>
  );
}
