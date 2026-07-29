// 딜소싱 · 프로젝트 등록 라우트(FR-DS-01/02, v1.1 신규 3단계 화면).
// 근거: ARCHITECTURE.md §3(L2, v1.1 신규 9종 중 1) · §5.3 registerDeal(세션 쓰기, A8 v1.1 개정)

import { DealSourcingForm } from "@/components/deal/DealSourcingForm";
import { GovernancePrincipleBanner } from "@/components/shared/GovernancePrincipleBanner";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function DealSourcingPage() {
  return (
    // ④ 폼 아키타입 수렴: 캔버스 밴드 + 반응형 거터 + 폼 폭 중앙 정렬, eyebrow+headline 헤더.
    <div className="flex-1 bg-background px-6 py-16 md:px-16 md:py-24">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="space-y-4">
          <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
            [ DEAL SOURCING · 프로젝트 등록 ]
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
              딜소싱 · 프로젝트 <span className="text-primary">등록</span>
            </h1>
            <AutomationLevelBadge frId="FR-DS-01" />
          </div>
          <p className="max-w-2xl text-sm text-guud-text-muted-2">
            협업 프로젝트를 등록하면 딜룸 파이프라인에 씨앗 단계로 반영되고,
            "내가 제안한 딜"로 우선 노출됩니다. 등록은 이번 세션에서만 유지되는
            시뮬레이션입니다(새로고침 시 초기화).
          </p>
        </div>
        <GovernancePrincipleBanner />
        <DealSourcingForm />
      </div>
    </div>
  );
}
