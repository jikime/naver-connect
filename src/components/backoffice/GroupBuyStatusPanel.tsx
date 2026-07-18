// GroupBuyStatusPanel — 공동구매 현황판(기장 대행 20개 조직 묶음 예시, FR-BO-03).
// 근거: ARCHITECTURE.md §3(L2 BackOffice), TASKS.md T-021

import type { GroupBuy } from "@/types";

export function GroupBuyStatusPanel({ groupBuys }: { groupBuys: GroupBuy[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-bold text-foreground">
        공동구매 현황
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groupBuys.map((groupBuy) => {
          const progress = Math.min(
            100,
            Math.round(
              (groupBuy.member_org_count / groupBuy.target_count) * 100,
            ),
          );
          return (
            <div key={groupBuy.id} className="border border-guud-hairline p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {groupBuy.service_name}
                </h3>
                <span className="text-xs text-guud-text-muted-2">
                  {groupBuy.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-guud-text-muted-2">
                {groupBuy.member_org_count} / {groupBuy.target_count}개 조직
                참여
              </p>
              <div className="mt-2 h-2 w-full bg-guud-surface-alt-2">
                <div
                  className="h-2 bg-primary"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${groupBuy.service_name} 참여 진행률`}
                />
              </div>
              <p className="mt-2 text-xs text-guud-text-subtle">
                {groupBuy.unit_price_cut}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
