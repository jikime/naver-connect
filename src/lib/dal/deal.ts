// DAL: 3단계 딜룸 보드 + 백오피스 마켓(전문가 서비스·공동구매).
// 근거: ARCHITECTURE.md §5.2, FR-DR-01~05, FR-BO-01~04/06/07
// deal_rooms.json은 민감 시드(핫리드 씨앗 참조) — 이 파일이 유일한 import 지점이어야 한다(ADR-03).
// v1.1: FR-DR-05("내 딜 현황" 우선 정렬 + 딜소싱 등록분 반영)·FR-BO-06(getExpertMatches) 추가.
// v1.0 딜룸 보드·백오피스(FR-DR-01~04·FR-BO-01~05)는 여전히 정적 스텁(입력 없음) — registerDeal만
// 쓰기 결과는 사용자별 서버 상태에 저장하고 Zustand는 화면 반응용 캐시로만 사용한다.

import type { DatasetLoader } from "@/lib/dal/datasets";
import { getDataset } from "@/lib/dal/datasets";
import {
  hydrateRuntimeState,
  setRuntimeStateValue,
} from "@/lib/dal/runtime-state";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  DealRoom,
  ExpertService,
  ExpertServicesSeed,
  GroupBuy,
  ViewerContext,
} from "@/types";

type OrgSeed = { id: string; field_tags: number[]; member_id: string | null };
type FieldSeed = { id: number; name: string };

async function getExpertServicesData(
  loadDataset: DatasetLoader = getDataset,
): Promise<{
  services: ExpertService[];
  groupBuys: GroupBuy[];
}> {
  const document = await loadDataset<ExpertServicesSeed>("expert-services");
  return {
    services: (document.services ?? []).filter(
      (service): service is ExpertService => Boolean(service?.expert_id),
    ),
    groupBuys: document.groupBuys ?? [],
  };
}

/** "내가 제안한 딜"(owner) → "내가 참여한 딜"(participating) → 그 외 순으로 정렬(FR-DR-05). */
function sortMyDealsFirst(
  rooms: DealRoom[],
  personaId: string | undefined,
): DealRoom[] {
  if (!personaId) {
    return rooms;
  }
  const rank = (room: DealRoom): number => {
    if (room.owner_member_id === personaId) {
      return 0;
    }
    if (room.participating_member_ids.includes(personaId)) {
      return 1;
    }
    return 2;
  };
  // 동순위에서는 세션 등록분(딜소싱 직후)이 시드보다 위 — 방금 등록한 딜이 바로 보여야 한다(FR-DS-01).
  const sessionFirst = (room: DealRoom): number =>
    room.id.startsWith("DR-SESSION-") ? 0 : 1;
  return [...rooms].sort(
    (a, b) => rank(a) - rank(b) || sessionFirst(a) - sessionFirst(b),
  );
}

/**
 * 딜룸 파이프라인 보드(FR-DR-01~03). 기본 데이터와 사용자별 딜소싱 등록분을
 * registerDeal)을 합쳐 반환하고, "내가 제안·진행하는 딜"을 우선 정렬한다(FR-DR-05).
 * 상세 편집·상태 전이는 여전히 제공하지 않는다(FR-DR-04, 정적 스텁 경계 A8 v1.1).
 */
export async function getDealRooms(
  vc: ViewerContext,
  loadDataset: DatasetLoader = getDataset,
): Promise<DealRoom[]> {
  if (loadDataset === getDataset) await hydrateRuntimeState();
  const dealRooms = await loadDataset<DealRoom[]>("deal-rooms");
  const registered = useSessionInteractionStore.getState().registeredDeals;
  return sortMyDealsFirst([...dealRooms, ...registered], vc.personaId);
}

/** 백오피스 마켓 카탈로그 + 공동구매 현황(FR-BO-01~04/07). */
export async function getExpertServices(
  _vc: ViewerContext,
  loadDataset: DatasetLoader = getDataset,
): Promise<{ services: ExpertService[]; groupBuys: GroupBuy[] }> {
  return getExpertServicesData(loadDataset);
}

/**
 * 딜의 참여 조직들이 속한 분야명을 유도한다(organizations.field_tags → fields.name).
 * FR-BO-06(맞춤 전문기관)·자원검색 매칭의 공통 근거 — 그럴듯한 목업 매칭이며, 시드 자체를
 * 창작하지 않고 이미 존재하는 organizations/fields 관계에서만 파생한다.
 */
export async function resolveDealFieldNames(dealId: string): Promise<string[]> {
  await hydrateRuntimeState();
  const [dealRooms, organizations, fields] = await Promise.all([
    getDataset<DealRoom[]>("deal-rooms"),
    getDataset<OrgSeed[]>("organizations"),
    getDataset<FieldSeed[]>("fields"),
  ]);
  const room = dealRooms
    .concat(useSessionInteractionStore.getState().registeredDeals)
    .find((r) => r.id === dealId);
  if (!room) {
    return [];
  }
  const fieldIds = new Set<number>();
  for (const orgId of room.participating_orgs) {
    const org = organizations.find((o) => o.id === orgId);
    org?.field_tags.forEach((id) => {
      fieldIds.add(id);
    });
  }
  return [...fieldIds]
    .map((id) => fields.find((f) => f.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

/**
 * 등록된 딜에 맞춤형 전문기관을 2~3인 추천한다(FR-BO-06). 회계세무는 모든 딜에 보편적으로
 * 필요하다고 보고 항상 포함하고, 정책사업·컨소시엄 성격의 유입 경로(외부공고·공고역방향·
 * 딜소싱·격차기회카드)면 제안서·사업계획 자문(기획)도 함께 매칭한다. 공급자가 2인뿐인
 * 시드 규모상 상한은 2~3인이 아니라 "가용한 만큼"이다(9번째 페르소나 신설 금지, 시드 확장 없음).
 */
export async function getExpertMatches(
  _vc: ViewerContext,
  dealId: string,
): Promise<ExpertService[]> {
  await hydrateRuntimeState();
  const [dealRooms, expertServices] = await Promise.all([
    getDataset<DealRoom[]>("deal-rooms"),
    getExpertServicesData(),
  ]);
  const room = dealRooms
    .concat(useSessionInteractionStore.getState().registeredDeals)
    .find((r) => r.id === dealId);
  if (!room) {
    return [];
  }
  const policyDrivenSourceTypes: readonly DealRoom["source_type"][] = [
    "외부공고",
    "공고역방향",
    "딜소싱",
    "격차기회카드",
  ];
  const policyDriven = policyDrivenSourceTypes.includes(room.source_type);
  return expertServices.services.filter((svc) => {
    if (svc.category === "회계세무") {
      return true;
    }
    if (svc.category === "기획") {
      return policyDriven;
    }
    return false;
  });
}

/** FR-DS-01 딜소싱 폼 등록 입력. */
export interface DealSourcingInput {
  title: string;
  hasPolicyProgram: boolean;
  /** 참여자 Member.id[] — 등록자 본인을 포함한다. */
  participantMemberIds: string[];
  businessContent: string;
  expectedEffect: string;
}

/** memberId[] → 그 회원들이 대표로 있는 조직 id[] (organizations.member_id 역참조). */
function resolveOrgIdsForMembers(
  organizations: OrgSeed[],
  memberIds: string[],
): string[] {
  const ids = new Set<string>();
  for (const org of organizations) {
    if (org.member_id && memberIds.includes(org.member_id)) {
      ids.add(org.id);
    }
  }
  return [...ids];
}

/**
 * 딜소싱 폼 등록(FR-DS-01). v1.1 신규 3단계 쓰기 — SessionInteraction 스토어에만 반영되고
 * Supabase 사용자 상태에 저장한다. 등록된 딜은 씨앗 단계로 파이프라인에 즉시 반영되고
 * 새로고침과 재로그인 뒤에도 유지된다(FR-DR-05 연동).
 */
export async function registerDeal(
  vc: ViewerContext,
  payload: DealSourcingInput,
): Promise<DealRoom> {
  const state = await hydrateRuntimeState();
  const organizations = await getDataset<OrgSeed[]>("organizations");
  const participantIds = Array.from(
    new Set([vc.personaId, ...payload.participantMemberIds]),
  );
  const newRoom: DealRoom = {
    id: `DR-SESSION-${Date.now()}`,
    title: payload.title,
    stage: "씨앗",
    source_type: "딜소싱",
    source_ref: `딜소싱 등록 · ${vc.personaId}`,
    gate_status: {
      G1: { passed: false, date: null },
      G2: { passed: false, date: null },
      G3: { passed: false, date: null },
      G4: { passed: false, date: null },
    },
    participating_orgs: resolveOrgIdsForMembers(organizations, participantIds),
    agreement_doc: {
      note: `딜소싱 폼 등록 — 사업내용: ${payload.businessContent} / 기대효과: ${payload.expectedEffect} / 정책사업 연계: ${payload.hasPolicyProgram ? "있음" : "없음"}.`,
    },
    owner_member_id: vc.personaId,
    participating_member_ids: participantIds,
  };
  await setRuntimeStateValue("registeredDeals", [
    ...state.registeredDeals,
    newRoom,
  ]);
  return newRoom;
}
