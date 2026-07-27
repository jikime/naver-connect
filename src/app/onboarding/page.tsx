// /onboarding — 온보딩 위저드 라우트. 정적 셸은 Server Component, 위저드 본문은 Client(ADR-04).
// 근거: TASKS.md T-009a/T-009b, FR-ON-01~11, FR-GL-04(전역 네비 첫 진입 순서)

import type { Metadata } from "next";
import { OnbWizard } from "@/components/onboarding/OnbWizard";

export const metadata: Metadata = {
  title: "온보딩 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

export default function OnboardingPage() {
  return (
    // ④ 폼 아키타입 수렴: 캔버스 밴드 + 반응형 거터(px-6→px-16) + 넉넉한 수직 리듬, 폼 폭 중앙 정렬.
    <div className="flex-1 bg-background px-6 py-16 md:px-16 md:py-24">
      <div className="mx-auto w-full max-w-3xl">
        <OnbWizard />
      </div>
    </div>
  );
}
