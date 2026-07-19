// 추천 룰 설정 라우트(v1.1 · 1-5, 관리자 신규) — 정적 헤더는 Server Component, 편집은 Client(ADR-04).
// 근거: ARCHITECTURE.md §3(L1 /admin/rules), FR-RL-01/02/03

import { RuleSettings } from "@/components/admin/RuleSettings";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";

export default function AdminRulesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-guud-hairline px-[30px] py-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            추천 룰 설정
          </h1>
          <p className="mt-1 text-sm text-guud-text-muted-2">
            키워드 가중치를 조정하면 회원 쌍 매칭 점수가 다시 계산돼요.
          </p>
        </div>
        <AutomationLevelBadge frId="FR-RL-01" />
      </div>
      <RuleSettings />
    </div>
  );
}
