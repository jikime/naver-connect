// 딜소싱 · 프로젝트 등록 라우트(FR-DS-01/02, v1.1 신규 3단계 화면).
// 근거: ARCHITECTURE.md §3(L2, v1.1 신규 9종 중 1) · §5.3 registerDeal(세션 쓰기, A8 v1.1 개정)

import { DealSourcingForm } from "@/components/deal/DealSourcingForm";
import { GovernancePrincipleBanner } from "@/components/shared/GovernancePrincipleBanner";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function DealSourcingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-6 py-14 sm:px-10 lg:px-16">
          <div className="space-y-3">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ DEAL SOURCING · 프로젝트 등록 ]
            </p>
            <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              딜소싱 · 프로젝트 <span className="text-primary">등록</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
              협업 프로젝트를 등록하면 딜룸 파이프라인에 씨앗 단계로 반영되고,
              "내가 제안한 딜"로 우선 노출됩니다. 등록 내용은 로그인 계정에
              저장되어 새로고침하거나 다시 로그인해도 유지됩니다.
            </p>
          </div>
          <AutomationLevelBadge frId="FR-DS-01" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-14 sm:px-10 lg:px-16">
        <GovernancePrincipleBanner />
        <DealSourcingForm />
      </div>
    </div>
  );
}
