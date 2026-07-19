// 금융 서비스 라우트 — 프로젝트에 맞는 금융기관/상품 제안 + 직접 검색·연락(FR-FN-01~03, v1.1).
// 근거: ARCHITECTURE.md §3(L2, v1.1 신규 9종 중 1) · §5.2 getFinancialProducts

import { FinanceServiceSearch } from "@/components/finance/FinanceServiceSearch";
import { GovernancePrincipleBanner } from "@/components/shared/GovernancePrincipleBanner";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-6 px-[30px] py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          금융 서비스
        </h1>
        <AutomationLevelBadge frId="FR-FN-01" />
      </div>
      <p className="max-w-2xl text-sm text-guud-text-muted-2">
        프로젝트 분야·단계·지역에 맞는 금융기관/상품을 제안받거나 직접
        검색·연락합니다. 법률 검토가 끝나지 않은 상품(예: 신협 연계)은 상태
        뱃지만 표시하며 확정·계약 기능은 제공하지 않습니다.
      </p>
      <GovernancePrincipleBanner />
      <FinanceServiceSearch />
    </div>
  );
}
