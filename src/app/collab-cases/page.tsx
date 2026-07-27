// /collab-cases — 협업사례 입력·조회 + 시뮬레이션(FR-CS-01/02, v1.1 §8.16 신규 화면).
// 근거: PRD §8.16, ARCHITECTURE.md §3, TASKS #28
// 입력·시뮬레이션이 핵심 인터랙션이라 본문 전체를 Client로 둔다(ADR-04 — 정적 셸만 없음).

import type { Metadata } from "next";
import { CollabCasesView } from "@/components/collaboration/CollabCasesView";

export const metadata: Metadata = {
  title: "협업사례 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

export default function CollabCasesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto w-full max-w-5xl space-y-3 px-6 py-14 sm:px-10 lg:px-16">
          <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
            [ LAYER 02 · COLLAB CASES ]
          </p>
          <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            협업 <span className="text-primary">사례</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
            진행됐거나 진행 중인 협력 사례를 확인하고, 우리 조직 기준으로 가능한
            협업 조합을 시뮬레이션해보세요. 새로운 사례도 입력할 수 있어요(이번
            세션에만 반영).
          </p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-10 lg:px-16">
        <CollabCasesView />
      </div>
    </div>
  );
}
