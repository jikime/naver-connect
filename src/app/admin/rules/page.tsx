// 추천 룰 설정 라우트(v1.1 · 1-5, 관리자 신규) — 정적 헤더는 Server Component, 편집은 Client(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /admin/rules), FR-RL-01/02/03

import { RuleSettings } from "@/components/admin/RuleSettings";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function AdminRulesPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ④ 헤더 밴드: eyebrow + headline, 반응형 거터, 중앙 정렬 폭 */}
      <div className="border-b border-guud-hairline bg-background px-6 py-10 md:px-16">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ ADMIN · 추천 룰 ]
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
              추천 룰 <span className="text-primary">설정</span>
            </h1>
            <p className="text-sm text-guud-text-muted-2">
              키워드 가중치를 조정하면 회원 쌍 매칭 점수가 다시 계산돼요.
            </p>
          </div>
          <AutomationLevelBadge frId="FR-RL-01" />
        </div>
      </div>
      <RuleSettings />
    </div>
  );
}
