// 회원 검색 라우트(v1.1 · 1-4, 신규) — 정적 헤더는 Server Component, 검색은 Client 위임(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /search), FR-SR-01/02

import { MemberSearch } from "@/components/search/MemberSearch";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function SearchPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-6 py-14 sm:px-10 lg:px-16">
          <div className="space-y-3">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ MEMBER SEARCH ]
            </p>
            <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              회원 <span className="text-primary">검색</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
              이름·조직·키워드·분야로 다른 회원을 직접 찾아볼 수 있어요. 비공개
              정보(수요·핫리드)는 본인·운영자에게만 보여요.
            </p>
          </div>
          <AutomationLevelBadge frId="FR-SR-01" />
        </div>
      </header>
      <MemberSearch />
    </div>
  );
}
