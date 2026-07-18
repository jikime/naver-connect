// 딜룸 파이프라인 보드 라우트 — 3단계 정적 스텁(FR-DR-01~04). 편집·드래그 없음.
// 근거: ARCHITECTURE.md §3(L2 DealBoard), TASKS.md T-020
// 정적 콘텐츠라 Server Component로 두고 DAL(getDealRooms)에서 직접 가져온다(ADR-04) —
// deal_rooms.json은 민감 시드(핫리드 씨앗 참조)라 이 라우트도 DAL 경유로만 접근한다(ADR-03).

import { DealRoomBoard } from "@/components/deal/DealRoomBoard";
import { GovernancePrincipleBanner } from "@/components/shared/GovernancePrincipleBanner";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { getDealRooms } from "@/lib/dal";

export default async function DealRoomsPage() {
  // 딜룸 보드는 가시성 계층이 없는 시드라 페르소나별로 마스킹되지 않는다 — 뷰어 컨텍스트는
  // DAL 시그니처 계약(ADR-05)을 지키기 위한 고정 placeholder.
  const dealRooms = await getDealRooms({ role: "기업가", personaId: "M-001" });

  return (
    <div className="flex flex-col gap-6 px-[30px] py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          딜룸 파이프라인
        </h1>
        <AutomationLevelBadge frId="FR-DR-01" />
      </div>
      <p className="max-w-2xl text-sm text-guud-text-muted-2">
        핫리드·격차 기회카드·모임·외부공고·공고 역방향, 5개 입구에서 들어온 협업
        씨앗이 5단계(씨앗→탐색→기획→실행→자립)를 거쳐 사업화됩니다. 각 카드의
        유입 경로와 G1~G4 게이트 통과 현황으로 관계·기회·사업 층이 어떻게
        이어지는지 확인하세요.
      </p>
      <GovernancePrincipleBanner />
      <DealRoomBoard dealRooms={dealRooms} />
    </div>
  );
}
