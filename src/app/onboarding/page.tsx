// /onboarding — 온보딩 위저드 라우트. 정적 셸은 Server Component, 위저드 본문은 Client(ADR-04).
// 근거: TASKS.md T-009a/T-009b, FR-ON-01~11, FR-GL-04(전역 네비 첫 진입 순서)

import type { Metadata } from "next";
import { OnbWizard } from "@/components/onboarding/OnbWizard";

export const metadata: Metadata = {
  title: "온보딩 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-[30px] py-10">
      <OnbWizard />
    </div>
  );
}
