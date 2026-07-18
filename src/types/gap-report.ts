// 격차 리포트 (2단계) — Region / GapCard
// 근거: ARCHITECTURE.md §4.2, FR-GR-01~06, BR-08/BR-11
// 시드: region_hanbit.json, gap_cards.json (비민감)

export interface Region {
  id: string;
  /** "한빛구" */
  name: string;
  actor_counts: { label: string; count: number; metric?: string }[];
  /** 잠재/실제/커버리지율 (예: 12 / 4 / 33) */
  coverage: { potential: number; actual: number; rate: number };
  /** "돌봄↔주거" */
  highlighted_gap_axis: string;
}

/** G1~G3 (FR-GR-05) */
export interface GapCard {
  /** "G1".."G3" */
  id: string;
  region_id: string;
  title: string;
  connection_count: number;
  phenomenon: string;
  /** StageLinkId[] (BR-08) */
  stage_link_basis: number[];
  related_members: { member_id: string; role: string }[];
  /** Resource∪Opportunity 유니온 (BR-11) */
  candidate_resources: string[];
  actions: {
    type: "추천발송" | "모듬개설" | "3단계협업지원";
    desc: string;
  }[];
}
