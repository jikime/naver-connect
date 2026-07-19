// DAL: 생태계맵 v2 read/write — 밸류체인→5-force→실제 단체(지역 세분화) + "내 소속/대상 단체".
// 근거: ARCHITECTURE.md §5.2/§5.3, FR-EM2-01~04 (v1.1 §8.15 — 구 FR-EM-01~03 카드 리스트 대체,
// PRD §8.11 "이웃회원(주간추천과 중복)·주변조직(모호)" 카드 리스트는 폐기)
// FR-EM2-01~03의 3단 드릴다운은 정적 시드가 작아 DAL이 필드 스코프 번들을 반환하고
// 컴포넌트가 단계(field→stage→force→region)를 클라이언트 상태로 좁혀나간다(gap-report와 동일 패턴).

import fiveForcesSeed from "@/data/five_forces.json";
import organizationsSeed from "@/data/organizations.json";
import vcStagesSeed from "@/data/vc_stages.json";
import { getMember } from "@/lib/dal/members";
import { useBusinessRelationSessionStore } from "@/stores/business-relation-session";
import type { FiveForce, Organization, VCStage, ViewerContext } from "@/types";

const vcStages = vcStagesSeed as VCStage[];
const fiveForces = fiveForcesSeed as FiveForce[];
const organizations = organizationsSeed as Organization[];

/**
 * 생태계맵 v2 번들(FR-EM2-01/02/04): 밸류체인 단계 → 5-force 이해관계자 → 실제 단체.
 * field 생략 시 전체 밸류체인을 반환(초기 화면), region 지정 시 단체를 sido로 한 번 더 좁힌다.
 * 5-force·지역 세분화 세팅은 운영자 사전 세팅 값(시드)을 그대로 읽기 전용으로 노출한다(FR-EM2-04).
 */
export async function getEcosystemMap(
  _vc: ViewerContext,
  field?: number,
  region?: string,
): Promise<{ stages: VCStage[]; forces: FiveForce[]; orgs: Organization[] }> {
  const stages = field
    ? vcStages.filter((s) => s.field_id === field)
    : vcStages;
  const stageIds = new Set(stages.map((s) => s.id));
  const forces = fiveForces.filter((f) => stageIds.has(f.vc_stage_id));

  const relevantOrgIds = new Set(forces.flatMap((f) => f.org_ids));
  let orgs = organizations.filter(
    (o) =>
      relevantOrgIds.has(o.id) || (field ? o.field_tags.includes(field) : true),
  );
  if (region) {
    orgs = orgs.filter((o) => o.region.sido === region);
  }

  return { stages, forces, orgs };
}

/**
 * "내 소속 단체 / 내가 대상으로 하는 단체" 조회(FR-EM2-03). 세션 오버라이드가 있으면
 * 그것을, 없으면 회원 시드 기본값(member.affiliation_org_id/target_org_ids)을 반환한다.
 */
export async function getMyOrgs(
  vc: ViewerContext,
): Promise<{ affiliationOrgId: string | null; targetOrgIds: string[] }> {
  const override =
    useBusinessRelationSessionStore.getState().myOrgsOverrides[vc.personaId];
  if (override) {
    return {
      affiliationOrgId: override.affiliationOrgId,
      targetOrgIds: override.targetOrgIds,
    };
  }
  const member = await getMember(vc, vc.personaId);
  return {
    affiliationOrgId: member.affiliation_org_id,
    targetOrgIds: member.target_org_ids,
  };
}

/** "내 소속/대상 단체" 설정(FR-EM2-03). 세션 스토어만 갱신, 새로고침 시 시드로 리셋(A6/C-3). */
export async function setMyOrgs(
  vc: ViewerContext,
  affiliationOrgId: string | null,
  targetOrgIds: string[],
): Promise<void> {
  useBusinessRelationSessionStore
    .getState()
    .setMyOrgs(vc.personaId, { affiliationOrgId, targetOrgIds });
}
