// 딜소싱 · 프로젝트 등록 라우트(FR-DS-01/02, v1.1 신규 3단계 화면).
// 근거: ARCHITECTURE.md §3(L2, v1.1 신규 9종 중 1) · §5.3 registerDeal(세션 쓰기, A8 v1.1 개정)

import { DealSourcingForm } from "@/components/deal/DealSourcingForm";
import { GovernancePrincipleBanner } from "@/components/shared/GovernancePrincipleBanner";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function DealSourcingPage() {
  return (
    <div className="flex flex-col gap-6 px-[30px] py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          딜소싱 · 프로젝트 등록
        </h1>
        <AutomationLevelBadge frId="FR-DS-01" />
      </div>
      <p className="max-w-2xl text-sm text-guud-text-muted-2">
        협업 프로젝트를 등록하면 딜룸 파이프라인에 씨앗 단계로 반영되고, "내가
        제안한 딜"로 우선 노출됩니다. 등록은 이번 세션에서만 유지되는
        시뮬레이션입니다(새로고침 시 초기화).
      </p>
      <GovernancePrincipleBanner />
      <DealSourcingForm />
    </div>
  );
}
