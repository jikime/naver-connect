// 회원 검색 라우트(v1.1 · 1-4, 신규) — 정적 헤더는 Server Component, 검색은 Client 위임(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /search), FR-SR-01/02

import { MemberSearch } from "@/components/search/MemberSearch";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function SearchPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-guud-hairline px-[30px] py-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            회원 검색
          </h1>
          <p className="mt-1 text-sm text-guud-text-muted-2">
            이름·조직·키워드·분야로 다른 회원을 직접 찾아볼 수 있어요. 비공개
            정보(수요·핫리드)는 본인·운영자에게만 보여요.
          </p>
        </div>
        <AutomationLevelBadge frId="FR-SR-01" />
      </div>
      <MemberSearch />
    </div>
  );
}
