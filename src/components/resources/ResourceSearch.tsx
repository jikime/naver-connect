"use client";

// ResourceSearch — 정책사업 검색(FR-RS-01) + 내 딜 매칭(FR-RS-02).
// 근거: ARCHITECTURE.md §5.2 searchOpportunities/matchOpportunitiesForDeal, TASKS.md 승계 FR-RS-01/02
// opportunities.json은 v1.0 실문서 근거 시드 — 검색 자체는 순수 필터라 세션 쓰기가 없다.

import { useEffect, useMemo, useState } from "react";
import { OpportunityCard } from "@/components/resources/OpportunityCard";
import {
  getDealRooms,
  matchOpportunitiesForDeal,
  searchOpportunities,
} from "@/lib/dal";
import { cn } from "@/lib/utils";
import { useViewerContext } from "@/stores/viewer-context";
import type { DealRoom, Opportunity } from "@/types";

const ALL = "전체";

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-muted text-guud-text-muted-2",
      )}
    >
      {label}
    </button>
  );
}

function MyDealMatches() {
  const vc = useViewerContext();
  const [myDeals, setMyDeals] = useState<DealRoom[] | null>(null);
  const [matches, setMatches] = useState<Record<string, Opportunity[]>>({});

  useEffect(() => {
    let cancelled = false;
    getDealRooms(vc).then((rooms) => {
      if (cancelled) {
        return;
      }
      const owned = rooms.filter((r) => r.owner_member_id === vc.personaId);
      setMyDeals(owned);
      owned.forEach((room) => {
        matchOpportunitiesForDeal(vc, room.id).then((matched) => {
          if (!cancelled) {
            setMatches((prev) => ({ ...prev, [room.id]: matched }));
          }
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [vc]);

  if (!myDeals || myDeals.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 border border-guud-hairline bg-muted p-4">
      <h2 className="font-heading text-base font-bold text-foreground">
        내 딜 매칭 (FR-RS-02)
      </h2>
      {myDeals.map((room) => {
        const matched = matches[room.id];
        return (
          <div key={room.id} className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold text-foreground">
              {room.title}
            </p>
            {matched === undefined ? (
              <p className="text-xs text-guud-text-muted-2">매칭 확인 중…</p>
            ) : matched.length === 0 ? (
              <p className="text-xs text-guud-text-faint">
                이 딜과 분야가 겹치는 공고가 없습니다.
              </p>
            ) : (
              <p className="text-xs text-guud-text-muted-2">
                "이 공고, 이 팀이면 가능합니다" —{" "}
                {matched.map((m) => m.source).join(", ")}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}

export function ResourceSearch() {
  const vc = useViewerContext();
  const [keyword, setKeyword] = useState("");
  const [field, setField] = useState<string>(ALL);
  const [region, setRegion] = useState<string>(ALL);
  const [consortium, setConsortium] = useState<string>(ALL);
  const [all, setAll] = useState<Opportunity[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchOpportunities(vc).then((result) => {
      if (!cancelled) {
        setAll(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vc]);

  const fieldOptions = useMemo(
    () => [ALL, ...Array.from(new Set((all ?? []).map((o) => o.field)))],
    [all],
  );
  const regionOptions = useMemo(
    () => [ALL, ...Array.from(new Set((all ?? []).map((o) => o.region)))],
    [all],
  );

  const filtered = (all ?? []).filter((opp) => {
    if (field !== ALL && opp.field !== field) {
      return false;
    }
    if (region !== ALL && opp.region !== region) {
      return false;
    }
    if (consortium === "필요" && !opp.consortium_required) {
      return false;
    }
    if (consortium === "불필요" && opp.consortium_required) {
      return false;
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      const haystack =
        `${opp.source} ${opp.field} ${opp.region} ${opp.target_requirement}`.toLowerCase();
      if (!haystack.includes(kw)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <MyDealMatches />
      <section className="flex flex-col gap-4">
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="키워드로 검색 (예: 돌봄, 컨소시엄, 디지털)"
          className="h-10 w-full border border-transparent border-b-input bg-transparent px-0 py-1 text-base outline-none placeholder:text-muted-foreground focus-visible:border-b-ring"
          aria-label="정책사업 키워드 검색"
        />
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="분야 필터"
        >
          {fieldOptions.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={field === option}
              onClick={() => setField(option)}
            />
          ))}
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="지역 필터"
        >
          {regionOptions.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={region === option}
              onClick={() => setRegion(option)}
            />
          ))}
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="컨소시엄 요건 필터"
        >
          {[ALL, "필요", "불필요"].map((option) => (
            <FilterChip
              key={option}
              label={option === ALL ? "컨소시엄 전체" : `컨소시엄 ${option}`}
              active={consortium === option}
              onClick={() => setConsortium(option)}
            />
          ))}
        </div>
      </section>
      {all === null ? (
        <p className="text-sm text-guud-text-muted-2">
          공고를 불러오는 중입니다…
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-guud-text-muted-2">
          조건에 맞는 공고가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
