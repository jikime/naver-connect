// Meetup — 개설된 모듬 (v1.1 신규 시드, ADR-06 개정: 독립 시드로 확정) [창작 목업]
// 근거: ARCHITECTURE.md §4.2, FR-MG-01, FR-RC-08, FR-GR-06
// 시드: src/data/meetups.json (비민감). recommendations 의 rec_kind='모듬'(REC-05)이 meetup_id 로 참조.

export interface Meetup {
  id: string;
  /** FR-MG-01 필터 */
  type: "학습모임" | "취미모임" | "지역앰배서더" | "공공모듬";
  title: string;
  purpose: string;
  /** FR-MG-01 분야 필터 (비어 있을 수 있음 — 취미모임 등) */
  field_tags: number[];
  region: { sido: string; sigungu: string };
  member_ids: string[];
  host_member_id: string;
  /** 개설 경로 */
  created_source: "격차카드모듬개설" | "공공중간지원추천" | "자발개설";
}
