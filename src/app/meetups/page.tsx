// 개설된 모듬 라우트(v1.1 · 1-6, 신규) — 정적 헤더는 Server Component, 목록·검색은 Client(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /meetups), FR-MG-01

import { MeetupList } from "@/components/meetups/MeetupList";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function MeetupsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-guud-hairline px-[30px] py-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            개설된 모듬
          </h1>
          <p className="mt-1 text-sm text-guud-text-muted-2">
            유형·분야·지역으로 개설된 모듬을 찾아 참여해보세요.
          </p>
        </div>
        <AutomationLevelBadge frId="FR-MG-01" />
      </div>
      <MeetupList />
    </div>
  );
}
