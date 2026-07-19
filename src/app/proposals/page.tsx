// /proposals — 프로젝트 제안·트래킹(FR-PP-01/02, v1.1 §8.17 신규 화면).
// 근거: PRD §8.17, ARCHITECTURE.md §3, TASKS #28
// 상태 전이 인터랙션이 핵심이라 본문 전체를 Client로 둔다(ADR-04 — 정적 셸만 없음).

import type { Metadata } from "next";
import { ProposalsView } from "@/components/collaboration/ProposalsView";

export const metadata: Metadata = {
  title: "제안 트래킹 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

export default function ProposalsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-[30px] py-10">
      <header className="mb-6 space-y-2">
        <p className="text-xs font-semibold text-guud-text-muted-2">
          2단계 · 프로젝트 제안·트래킹
        </p>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          프로젝트 제안 트래킹
        </h1>
        <p className="max-w-2xl text-sm text-guud-text-muted-2">
          생태계맵·협업사례에서 나온 프로젝트 제안을 제안됨→검토→성사/중단
          단계로 관리합니다.
        </p>
      </header>
      <ProposalsView />
    </div>
  );
}
