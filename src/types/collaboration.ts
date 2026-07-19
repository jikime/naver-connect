// 협업 사례 + 프로젝트 제안·트래킹 (v1.1 신규 시드) [창작 목업]
// 근거: ARCHITECTURE.md §4.2, FR-CS-01/02, FR-GR-09/10, FR-PP-01/02, FR-DS-01
// 시드: src/data/collab_cases.json, src/data/project_proposals.json (비민감)

/** 협업 사례 (FR-CS-01/02, FR-GR-09) */
export interface CollabCase {
  id: string;
  title: string;
  status: "완료" | "진행중";
  participant_org_ids: string[];
  period: string;
  outcome_summary: string;
  field_tags: number[];
  /** 입력 주체(세션 입력 시뮬레이션) */
  input_by: "회원" | "운영자";
}

/** 프로젝트 제안·트래킹 (FR-PP-01/02, FR-DS-01, FR-GR-10) */
export interface ProjectProposal {
  id: string;
  title: string;
  /** FR-PP-01 관계정보 기반 근거 */
  basis: { type: "생태계맵" | "협업사례"; ref: string };
  participant_member_ids: string[];
  expected_effect: string;
  /** FR-PP-02 트래킹 상태 전이 */
  track_status: "제안됨" | "검토" | "성사" | "중단";
  /** FR-DS-01 정책사업 유무 */
  has_policy_program: boolean;
  /** 딜소싱 등록 시 DealRoom 연결 */
  linked_deal_id: string | null;
}
