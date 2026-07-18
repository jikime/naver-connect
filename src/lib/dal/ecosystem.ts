// DAL: 생태계 이웃 read — 현재 회원의 지역·분야 기준 주변 조직 + 이웃 회원.
// 근거: ARCHITECTURE.md §5.2, FR-EM-01(경량 카드 리스트, 노드-엣지 다이어그램 아님)

import organizationsSeed from "@/data/organizations.json";
import { getMember, getMembers } from "@/lib/dal/members";
import type { MaskedMember, Organization, ViewerContext } from "@/types";

const organizations = organizationsSeed as Organization[];

function sharesRegionOrField(
  a: { region: { sido: string; sigungu: string }; field_tags: number[] },
  b: { region: { sido: string; sigungu: string }; field_tags: number[] },
): boolean {
  const sameRegion =
    a.region.sido === b.region.sido && a.region.sigungu === b.region.sigungu;
  const sharedField = a.field_tags.some((tag) => b.field_tags.includes(tag));
  return sameRegion || sharedField;
}

/**
 * 내 주변 생태계(FR-EM-01): 현재 회원과 지역 또는 분야가 겹치는 조직·이웃 회원.
 * EcosystemMap(T-011)이 경량 카드 리스트로만 렌더한다(연결맵 SVG와 별개 컴포넌트, FR-EM-03).
 */
export async function getEcosystemNeighbors(
  vc: ViewerContext,
): Promise<{ orgs: Organization[]; members: MaskedMember[] }> {
  const me = await getMember(vc, vc.personaId);
  const meRegionAndField = { region: me.region, field_tags: me.field_tags };

  const orgs = organizations.filter(
    (org) =>
      org.member_id !== vc.personaId &&
      sharesRegionOrField(meRegionAndField, org),
  );

  const allMembers = await getMembers(vc);
  const members = allMembers.filter(
    (m) => m.id !== vc.personaId && sharesRegionOrField(meRegionAndField, m),
  );

  return { orgs, members };
}
