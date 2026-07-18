// SupplierView — 뷰어가 전문가 역할이면 노출되는 공급자 뷰: 본인 카탈로그·수임량·이해충돌
// 공시(FR-BO-04). 역할 의존 콘텐츠라 Zustand ViewerContext를 읽는 Client Component로
// 둔다(ADR-04). 정산·거래 실기능은 없다(Out of Scope) — 공시·카탈로그 열람만.
// 근거: ARCHITECTURE.md §3(L2 BackOffice), TASKS.md T-021

"use client";

import { useViewerContextStore } from "@/stores/viewer-context";
import type { ExpertService } from "@/types";

export function SupplierView({ services }: { services: ExpertService[] }) {
  const role = useViewerContextStore((state) => state.role);
  const personaId = useViewerContextStore((state) => state.personaId);

  if (role !== "전문가") {
    return null;
  }

  const own = services.find((service) => service.expert_id === personaId);

  return (
    <section className="flex flex-col gap-4 border border-guud-hairline bg-muted p-5">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">
          공급자 뷰
        </h2>
        <p className="text-xs text-guud-text-muted-2">
          전문가 역할 전용 화면입니다. 본인 카탈로그·수임량·이해충돌 공시를
          확인합니다.
        </p>
      </div>
      {own ? (
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold text-foreground">
            {own.category} · {own.profile_badge}
          </p>
          <ul className="flex flex-col gap-1 text-xs text-guud-text-muted-2">
            {own.service_catalog.map((item) => (
              <li key={item.name}>
                {item.name} — {item.price_range}
              </li>
            ))}
          </ul>
          <p className="text-xs text-guud-text-muted-2">
            재계약률(수임 유지) {Math.round(own.recontract_rate * 100)}%
          </p>
          <p className="border-t border-guud-hairline pt-2 text-xs text-guud-text-subtle">
            이해충돌 공시: {own.coi_disclosure}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          등록된 공급 카탈로그가 아직 없습니다(향후 확장).
        </p>
      )}
    </section>
  );
}
