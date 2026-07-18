// 백오피스 마켓 라우트 — 전문가 서비스 카탈로그·공동구매 현황·공급자 뷰(FR-BO-01~05).
// 근거: ARCHITECTURE.md §3(L2 BackOffice), TASKS.md T-021
// 카탈로그·공동구매는 역할 무관 공통 뷰라 Server Component에서 DAL로 가져온다(ADR-04).
// 공급자 뷰만 현재 뷰어 역할에 의존하므로 SupplierView 내부에서 Zustand를 읽는다.

import { ExpertServiceCatalog } from "@/components/backoffice/ExpertServiceCatalog";
import { GroupBuyStatusPanel } from "@/components/backoffice/GroupBuyStatusPanel";
import { SupplierView } from "@/components/backoffice/SupplierView";
import { GovernancePrincipleBanner } from "@/components/shared/GovernancePrincipleBanner";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { getExpertServices } from "@/lib/dal";

export default async function BackOfficePage() {
  const { services, groupBuys } = await getExpertServices({
    role: "기업가",
    personaId: "M-001",
  });

  return (
    <div className="flex flex-col gap-6 px-[30px] py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          백오피스 마켓
        </h1>
        <AutomationLevelBadge frId="FR-BO-01" />
      </div>
      <p className="max-w-2xl text-sm text-guud-text-muted-2">
        전문가 회원이 직접 공급하는 회계·법무·기획 서비스를 카탈로그로 만나고,
        공동구매로 단가를 낮춥니다. 전문가 역할로 전환하면 본인
        카탈로그·수임량·이해충돌 공시가 담긴 공급자 뷰가 추가로 열립니다.
      </p>
      <GovernancePrincipleBanner />
      <ExpertServiceCatalog services={services} />
      <GroupBuyStatusPanel groupBuys={groupBuys} />
      <SupplierView services={services} />
    </div>
  );
}
