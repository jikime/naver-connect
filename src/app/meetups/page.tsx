// 개설된 모둠 라우트(v1.1 · 1-6, 신규) — 정적 헤더는 Server Component, 목록·검색은 Client(ADR-04).
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
              함께 시작하는 <span className="text-primary">모둠</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
              관심 있는 주제에 참여하거나 직접 모둠을 열어보세요. 두 명 이상
              모이면 온라인 첫 미팅 가능 시간을 공유할 수 있어요.
            </p>
          </div>
          <AutomationLevelBadge frId="FR-MG-01" />
        </div>
      </header>
      <MeetupList />
    </div>
  );
}
