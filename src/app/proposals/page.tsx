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
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto w-full max-w-6xl space-y-3 px-6 py-14 sm:px-10 lg:px-16">
          <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
            [ LAYER 02 · PROPOSAL TRACKING ]
          </p>
          <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            프로젝트 제안 <span className="text-primary">트래킹</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
            생태계맵·협업사례에서 나온 프로젝트 제안을 제안됨→검토→성사/중단
            단계로 관리합니다.
          </p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-10 lg:px-16">
        <ProposalsView />
      </div>
    </div>
  );
}
