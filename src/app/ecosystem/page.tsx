// /ecosystem — 내 주변 생태계맵 라우트. 정적 셸은 Server Component, 본문은 Client(ADR-04).
// 근거: TASKS.md T-011, FR-EM-01/02/03, FR-GL-04(전역 네비 3번째 진입)

import type { Metadata } from "next";
import { EcosystemMap } from "@/components/ecosystem/EcosystemMap";

export const metadata: Metadata = {
  title: "생태계맵 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

export default function EcosystemPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-[30px] py-10">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">
        내 주변 생태계맵
      </h1>
      <EcosystemMap />
    </div>
  );
}
