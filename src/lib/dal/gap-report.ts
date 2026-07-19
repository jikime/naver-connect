// DAL: 사업기회 발굴(구 격차 리포트) read — 지역 현황 + STAGE_LINK + 조직(buying_power
// 포함) + 기회카드 + 협업사례 묶음.
// 근거: ARCHITECTURE.md §5.2, FR-GR-01~05/08/09/10 (v1.1: buying_power·협업사례 추가)
// 목업 스코프는 지역 1곳("한빛구", OQ-01 이월)뿐이라 stageLinks/orgs/collabCases는 전건을
// 그대로 묶어 반환한다. 다지역 확장 시 이 지점에 지역별 필터를 추가한다.

import collabCasesSeed from "@/data/collab_cases.json";
import gapCardsSeed from "@/data/gap_cards.json";
import organizationsSeed from "@/data/organizations.json";
import regionHanbitSeed from "@/data/region_hanbit.json";
import stageLinksSeed from "@/data/stage_links.json";
import type {
  CollabCase,
  GapCard,
  Organization,
  Region,
  StageLink,
  ViewerContext,
} from "@/types";

const region = regionHanbitSeed as Region;
const stageLinks = stageLinksSeed as StageLink[];
const organizations = organizationsSeed as Organization[];
const gapCards = gapCardsSeed as GapCard[];
const collabCases = collabCasesSeed as CollabCase[];

/** 사업기회 발굴 셸(FR-GR-01/03) + 연결맵(FR-GR-02/04) + 기회카드(FR-GR-05) + buying_power·협업사례(v1.1 FR-GR-08/09) 데이터 묶음. */
export async function getGapReport(
  _vc: ViewerContext,
  regionId: string,
): Promise<{
  region: Region;
  stageLinks: StageLink[];
  orgs: Organization[];
  gapCards: GapCard[];
  collabCases: CollabCase[];
}> {
  if (region.id !== regionId) {
    throw new Error(`Region not found: ${regionId}`);
  }
  return {
    region,
    stageLinks,
    orgs: organizations,
    gapCards: gapCards.filter((card) => card.region_id === regionId),
    collabCases,
  };
}
