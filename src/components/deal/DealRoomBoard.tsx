// DealRoomBoard — 5단계(씨앗→탐색→기획→실행→자립) 칸반형 보드. 정적 스텁(FR-DR-04) —
// 편집·드래그·단계 이동 없음. 각 컬럼에 딜룸 카드를 배치해 층 연결 유입 경로를 함께 보여준다.
// 근거: ARCHITECTURE.md §3(L2 DealBoard), TASKS.md T-020, FR-DR-01/03/04

import { DealRoomCard } from "@/components/deal/DealRoomCard";
import type { DealRoom } from "@/types";

const STAGES: DealRoom["stage"][] = ["씨앗", "탐색", "기획", "실행", "자립"];

export function DealRoomBoard({ dealRooms }: { dealRooms: DealRoom[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {STAGES.map((stage) => {
          const rooms = dealRooms.filter((room) => room.stage === stage);
          return (
            <div key={stage} className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-guud-hairline pb-2">
                <h2 className="font-heading text-sm font-bold tracking-wide text-foreground uppercase">
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
                    <DealRoomCard key={room.id} room={room} />
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
