"use client";

// DealRoomBoard — 5단계(씨앗→탐색→기획→실행→자립) 칸반형 보드. v1.0 상세 편집·드래그·단계
// 이동은 여전히 없다(FR-DR-04, 정적 스텁 경계 A8 v1.1). v1.1: "내가 제안·진행하는 딜" 현황
// 관점으로 우선 노출하고(FR-DR-05), 딜소싱(FR-DS)에서 세션 등록된 딜도 함께 반영한다.
// 근거: ARCHITECTURE.md §3(L2 DealBoard), FR-DR-01~05

import { useEffect, useState } from "react";
import { DealRoomCard } from "@/components/deal/DealRoomCard";
import { getDataset, getDealRooms } from "@/lib/dal";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import { useViewerContext } from "@/stores/viewer-context";
import type { DealRoom } from "@/types";

type OrgLookup = { id: string; name: string; member_id: string | null };
type MemberLookup = { id: string; name: string };

const STAGES: DealRoom["stage"][] = ["씨앗", "탐색", "기획", "실행", "자립"];

export function DealRoomBoard() {
  const vc = useViewerContext();
  const registeredDeals = useSessionInteractionStore(
    (state) => state.registeredDeals,
  );
  const [dealRooms, setDealRooms] = useState<DealRoom[] | null>(null);
  const [organizations, setOrganizations] = useState<OrgLookup[]>([]);
  const [members, setMembers] = useState<MemberLookup[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: registeredDeals는 딜소싱 등록 시(FR-DS-01) 재조회를 트리거하기 위한 의도적 의존성(본문 미참조).
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDealRooms(vc),
      getDataset<OrgLookup[]>("organizations"),
      getDataset<MemberLookup[]>("members"),
    ]).then(([result, orgResult, memberResult]) => {
      if (!cancelled) {
        setDealRooms(result);
        setOrganizations(orgResult);
        setMembers(memberResult);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vc, registeredDeals]);

  if (dealRooms === null) {
    return (
      <p className="px-1 py-6 text-sm text-guud-text-muted-2">
        딜룸을 불러오는 중입니다…
      </p>
    );
  }

  const myDeals = dealRooms.filter(
    (room) =>
      room.owner_member_id === vc.personaId ||
      room.participating_member_ids.includes(vc.personaId),
  );

  return (
    <div className="flex flex-col gap-6">
      {myDeals.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-guud-hairline bg-muted p-5">
          <h2 className="font-heading text-lg font-light tracking-tight text-foreground">
            내가 제안·진행하는 딜 (FR-DR-05)
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {myDeals.map((room) => (
              <DealRoomCard
                key={room.id}
                room={room}
                viewerPersonaId={vc.personaId}
                organizations={organizations}
                members={members}
              />
            ))}
          </div>
        </section>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {STAGES.map((stage) => {
          const rooms = dealRooms.filter((room) => room.stage === stage);
          return (
            <div key={stage} className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-guud-hairline pb-2">
                <h2 className="font-mono text-xs font-medium tracking-[0.12em] text-foreground uppercase">
                  {stage}
                </h2>
                <span className="text-xs text-guud-text-muted-2">
                  {rooms.length}건
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {rooms.length === 0 ? (
                  <p className="border border-dashed border-guud-text-faint px-3 py-4 text-center text-xs text-guud-text-faint">
                    비어있음
                  </p>
                ) : (
                  rooms.map((room) => (
                    <DealRoomCard
                      key={room.id}
                      room={room}
                      viewerPersonaId={vc.personaId}
                      organizations={organizations}
                      members={members}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="border border-dashed border-guud-text-faint px-3 py-2 text-xs text-guud-text-faint">
        정적 스텁 — 카드 편집·드래그·단계 이동은 이번 범위 밖입니다(향후 확장).
      </p>
    </div>
  );
}
