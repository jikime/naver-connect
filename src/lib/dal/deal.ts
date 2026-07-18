// DAL: 3단계 정적 스텁 read — 딜룸 보드 + 백오피스 마켓(전문가 서비스·공동구매).
// 근거: ARCHITECTURE.md §5.2, FR-DR-01~03(딜룸은 편집 없는 정적 스텁, FR-DR-04), FR-BO-01~04
// deal_rooms.json은 민감 시드(핫리드 씨앗 참조) — 이 파일이 유일한 import 지점이어야 한다(ADR-03).

import expertServicesSeed from "@/data/expert_services.json";
import dealRoomsSeed from "@/data/private/deal_rooms.json";
import type {
  DealRoom,
  ExpertService,
  ExpertServicesSeed,
  GroupBuy,
  ViewerContext,
} from "@/types";

const dealRooms = dealRoomsSeed as DealRoom[];
const expertServices = expertServicesSeed as ExpertServicesSeed;

/** 딜룸 파이프라인 보드(FR-DR-01~03). 정적 스텁 — 편집/상태 전이는 제공하지 않는다(FR-DR-04). */
export async function getDealRooms(_vc: ViewerContext): Promise<DealRoom[]> {
  return dealRooms;
}

/** 백오피스 마켓 카탈로그 + 공동구매 현황(FR-BO-01~04). */
export async function getExpertServices(
  _vc: ViewerContext,
): Promise<{ services: ExpertService[]; groupBuys: GroupBuy[] }> {
  return {
    services: expertServices.services,
    groupBuys: expertServices.groupBuys,
  };
}
