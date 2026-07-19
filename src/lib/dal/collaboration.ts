// DAL: 협업사례 + 프로젝트 제안·트래킹 read/write (v1.1 2단계).
// 근거: ARCHITECTURE.md §5.2/§5.3, FR-CS-01/02, FR-PP-01/02, FR-GR-09/10
// 쓰기(inputCollabCase·trackProposal·simulateCollab 자체는 read)는 세션 스토어 한정
// (C-3·A8 v1.1 예외) — 새로고침 시 시드 초기값으로 리셋된다.

import collabCasesSeed from "@/data/collab_cases.json";
import organizationsSeed from "@/data/organizations.json";
import projectProposalsSeed from "@/data/project_proposals.json";
import { useBusinessRelationSessionStore } from "@/stores/business-relation-session";
import type {
  CollabCase,
  Organization,
  ProjectProposal,
  ViewerContext,
} from "@/types";

const collabCasesBase = collabCasesSeed as CollabCase[];
const organizations = organizationsSeed as Organization[];
const proposalsBase = projectProposalsSeed as ProjectProposal[];

/** 협업 사례 조회(FR-CS-01, FR-GR-09). 세션 중 입력분(inputCollabCase)을 덧붙인다. */
export async function getCollabCases(
  _vc: ViewerContext,
  filter?: { fieldId?: number; orgId?: string },
): Promise<CollabCase[]> {
  const all = [
    ...collabCasesBase,
    ...useBusinessRelationSessionStore.getState().addedCollabCases,
  ];
  return all.filter((c) => {
    if (filter?.fieldId && !c.field_tags.includes(filter.fieldId)) {
      return false;
    }
    if (filter?.orgId && !c.participant_org_ids.includes(filter.orgId)) {
      return false;
    }
    return true;
  });
}

/** 협업 사례 입력(FR-CS-01). 세션 스토어에만 반영, 새로고침 시 리셋(A6/C-3). */
export async function inputCollabCase(
  vc: ViewerContext,
  input: Omit<CollabCase, "id" | "input_by">,
): Promise<CollabCase> {
  const newCase: CollabCase = {
    id: `CC-USER-${Date.now()}`,
    input_by: vc.role === "운영자" ? "운영자" : "회원",
    ...input,
  };
  useBusinessRelationSessionStore.getState().addCollabCase(newCase);
  return newCase;
}

/**
 * 협업 시뮬레이션(FR-CS-02): 선택 조직과 field_tags를 공유하는 다른 조직을 겹치는
 * 분야 수·buying_power 순으로 정렬해 "가능한 협업 조합" 후보를 계산하고, 겹치는
 * 분야와 관련된 기존 협업 사례를 "유사 사례"로 함께 제시한다. 세션 한정 계산(서버 없음).
 */
export async function simulateCollab(
  _vc: ViewerContext,
  orgId: string,
): Promise<{
  baseOrg: Organization;
  candidates: {
    org: Organization;
    sharedFieldIds: number[];
    rationale: string;
  }[];
  similarCases: CollabCase[];
}> {
  const baseOrg = organizations.find((o) => o.id === orgId);
  if (!baseOrg) {
    throw new Error(`Organization not found: ${orgId}`);
  }

  const candidates = organizations
    .filter((o) => o.id !== orgId)
    .map((org) => {
      const sharedFieldIds = org.field_tags.filter((tag) =>
        baseOrg.field_tags.includes(tag),
      );
      return { org, sharedFieldIds };
    })
    .filter((c) => c.sharedFieldIds.length > 0)
    .sort((a, b) => {
      if (b.sharedFieldIds.length !== a.sharedFieldIds.length) {
        return b.sharedFieldIds.length - a.sharedFieldIds.length;
      }
      return b.org.buying_power - a.org.buying_power;
    })
    .slice(0, 5)
    .map((c) => ({
      ...c,
      rationale: `공유 분야 ${c.sharedFieldIds.length}개 · buying_power ${c.org.buying_power} — ${c.org.actor_type} 조직과의 협업 가능성`,
    }));

  const allCases = [
    ...collabCasesBase,
    ...useBusinessRelationSessionStore.getState().addedCollabCases,
  ];
  const similarCases = allCases.filter(
    (c) =>
      c.participant_org_ids.includes(orgId) ||
      c.field_tags.some((tag) => baseOrg.field_tags.includes(tag)),
  );

  return { baseOrg, candidates, similarCases };
}

/** 프로젝트 제안 조회(FR-PP-01, FR-GR-10). 세션 중 상태 변경분(trackProposal)을 반영한다. */
export async function getProposals(
  _vc: ViewerContext,
): Promise<ProjectProposal[]> {
  const overrides =
    useBusinessRelationSessionStore.getState().proposalStatusOverrides;
  return proposalsBase.map((p) =>
    overrides[p.id] ? { ...p, track_status: overrides[p.id] } : p,
  );
}

/** 제안 상태 전이(FR-PP-02): 제안됨→검토→성사/중단. 세션 스토어만 갱신. */
export async function trackProposal(
  _vc: ViewerContext,
  id: string,
  status: ProjectProposal["track_status"],
): Promise<ProjectProposal> {
  const base = proposalsBase.find((p) => p.id === id);
  if (!base) {
    throw new Error(`Proposal not found: ${id}`);
  }
  useBusinessRelationSessionStore.getState().setProposalStatus(id, status);
  return { ...base, track_status: status };
}
