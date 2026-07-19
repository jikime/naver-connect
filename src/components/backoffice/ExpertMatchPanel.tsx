"use client";

// ExpertMatchPanel — 등록된 딜에 맞춤형 전문기관(전문가) 2~3인 추천(FR-BO-06).
// 근거: ARCHITECTURE.md §5.2 getExpertMatches, FR-BO-06
// "내가 제안한 딜" 중 하나를 고르면 그 딜의 분야에 맞는 공급자를 보여준다(딜소싱 등록과 연동).

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExpertServiceCard } from "@/components/backoffice/ExpertServiceCard";
import { getDealRooms, getExpertMatches } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { useViewerContext } from "@/stores/viewer-context";
import type { DealRoom, ExpertService } from "@/types";

export function ExpertMatchPanel() {
  const vc = useViewerContext();
  const searchParams = useSearchParams();
  const initialDealId = searchParams.get("dealId");
  const [myDeals, setMyDeals] = useState<DealRoom[] | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [matches, setMatches] = useState<ExpertService[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDealRooms(vc).then((rooms) => {
      if (cancelled) {
        return;
      }
      const owned = rooms.filter((r) => r.owner_member_id === vc.personaId);
      setMyDeals(owned);
      const preselected =
        initialDealId && owned.some((r) => r.id === initialDealId)
          ? initialDealId
          : (owned[0]?.id ?? null);
      setSelectedDealId(preselected);
    });
    return () => {
      cancelled = true;
    };
  }, [vc, initialDealId]);

  useEffect(() => {
    if (!selectedDealId) {
      setMatches(null);
      return;
    }
    let cancelled = false;
    getExpertMatches(vc, selectedDealId).then((result) => {
      if (!cancelled) {
        setMatches(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vc, selectedDealId]);

  if (myDeals === null) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold text-foreground">
          맞춤 전문기관 추천
        </h2>
        <p className="text-sm text-guud-text-muted-2">불러오는 중입니다…</p>
      </section>
    );
  }

  if (myDeals.length === 0) {
    return (
      <section className="flex flex-col gap-3 border border-guud-hairline bg-muted p-4">
        <h2 className="font-heading text-lg font-bold text-foreground">
          맞춤 전문기관 추천
        </h2>
        <p className="text-sm text-guud-text-muted-2">
          내가 제안한 딜이 아직 없습니다. 딜소싱에서 프로젝트를 등록하면 딜
          분야에 맞는 전문기관을 추천받을 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-bold text-foreground">
        맞춤 전문기관 추천
      </h2>
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="내 딜 선택"
      >
        {myDeals.map((deal) => (
          <button
            key={deal.id}
            type="button"
            role="tab"
            aria-selected={selectedDealId === deal.id}
            onClick={() => setSelectedDealId(deal.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              selectedDealId === deal.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-muted text-guud-text-muted-2",
            )}
          >
            {deal.title}
          </button>
        ))}
      </div>
      {matches === null ? (
        <p className="text-xs text-guud-text-muted-2">매칭 확인 중…</p>
      ) : matches.length === 0 ? (
        <p className="text-xs text-guud-text-faint">
          이 딜에 맞는 전문기관이 아직 등록되어 있지 않습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((service) => (
            <ExpertServiceCard key={service.expert_id} service={service} />
          ))}
        </div>
      )}
    </section>
  );
}
