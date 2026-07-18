// 홈 랜딩 — 온보딩/프로필로 유도(T-007). 데이터 없이 정적 셸이라 Server Component로 둔다(ADR-04).
// 근거: TASKS.md T-007, FR-GL-04(전역 네비 진입 순서: 온보딩→프로필→생태계맵→주간추천)

import Link from "next/link";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-[30px] py-24 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          사회혁신기업가네트워크 AX 플랫폼
        </h1>
        <p className="text-base text-guud-text-muted-2">
          기업가·전문가가 온보딩 한 번으로 이어지고, 관계(추천)·기회(격차
          리포트)·사업(딜룸) 3층이 서로 연결되는 모습을 미리 봅니다. 상단 역할
          스위처로 8인 페르소나를 전환해보세요.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/onboarding">
            온보딩 시작하기 <AutomationLevelBadge frId="FR-ON-01" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/profile">내 프로필 보기</Link>
        </Button>
      </div>
    </div>
  );
}
