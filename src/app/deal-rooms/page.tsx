// 딜룸 파이프라인 보드 라우트(FR-DR-01~05). v1.0 상세 편집·드래그는 여전히 없다(FR-DR-04).
// 근거: ARCHITECTURE.md §3(L2 DealBoard) · FR-DR-05("내 딜 현황" 관점, 세션 반영)
// 보드가 세션 스토어(딜소싱 등록분)를 반영해야 해 Client Component로 데이터를 가져온다(ADR-04) —
// 이 셸은 정적 헤더만 Server Component로 두고 DealRoomBoard에 위임한다.

import Link from "next/link";
import { DealRoomBoard } from "@/components/deal/DealRoomBoard";
import { GovernancePrincipleBanner } from "@/components/shared/GovernancePrincipleBanner";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { Button } from "@/components/ui/button";

export default function DealRoomsPage() {
  return (
    <div className="flex flex-col gap-6 px-[30px] py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            딜룸 파이프라인
          </h1>
          <AutomationLevelBadge frId="FR-DR-01" />
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/deal-sourcing">딜소싱으로 새 딜 등록</Link>
        </Button>
      </div>
      <p className="max-w-2xl text-sm text-guud-text-muted-2">
        핫리드·격차 기회카드·모임·외부공고·공고 역방향·딜소싱, 5(+1)개 입구에서
        들어온 협업 씨앗이 5단계(씨앗→탐색→기획→실행→자립)를 거쳐 사업화됩니다.
        "내가 제안·진행하는 딜"이 우선 노출되며, 각 카드의 유입 경로와 G1~G4
        게이트 통과 현황으로 층 연결을 확인하세요.
      </p>
      <GovernancePrincipleBanner />
      <DealRoomBoard />
    </div>
  );
}
