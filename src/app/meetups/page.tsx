// 개설된 모듬 라우트(v1.1 · 1-6, 신규) — 정적 헤더는 Server Component, 목록·검색은 Client(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /meetups), FR-MG-01

import { MeetupList } from "@/components/meetups/MeetupList";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function MeetupsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-6 py-14 sm:px-10 lg:px-16">
          <div className="space-y-3">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ OPEN MEETUPS ]
            </p>
            <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              개설된 <span className="text-primary">모듬</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
              유형·분야·지역으로 개설된 모듬을 찾아 참여해보세요.
            </p>
          </div>
          <AutomationLevelBadge frId="FR-MG-01" />
        </div>
      </header>
      <MeetupList />
    </div>
  );
}
