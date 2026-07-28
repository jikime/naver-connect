// 협업 사례 + 프로젝트 제안·트래킹 + 협업관계 그래프 (v1.2 신규 시드)
// 근거: ARCHITECTURE.md §4.2, FR-CS-01/02, FR-GR-09/10, FR-PP-01/02, FR-DS-01
// 시드: src/data/collab_cases.json, src/data/project_proposals.json,
//       src/data/collab_relations.json, src/data/subgroup_map.json (비민감)

/**
 * 14개 하위그룹 코드.
 * 비사회적기업(C1-C4) / 지원가(B1-B4) / 활동가(A1-A6) 세 층으로 구성.
 * 근거: 5단계 순환형 가치흐름 밸류체인 문서(사혁넷 생태계).
 */
export type SubgroupCode =
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "B1"
  | "B2"
  | "B3"
  | "B4"
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "A5"
  | "A6";

/** 하위그룹이 속한 층(kind) */
export type SubgroupKind = "non-social" | "supporter" | "activist";

/** 하위그룹 메타 (코드·이름·층·STAGE 관여도) */
export interface SubgroupMeta {
  code: SubgroupCode;
  label: string;
  kind: SubgroupKind;
  /** STAGE 1~4 관여도 (0=없음, 1=보통, 2=핵심) */
  stage_dots: [number, number, number, number];
  plain: string;
}

/** ORG→하위그룹 코드 매핑 시드 (src/data/subgroup_map.json) */
export interface SubgroupMapEntry {
  org_id: string;
  subgroup_code: SubgroupCode;
  subgroup_label: string;
  kind: SubgroupKind;
  rationale: string;
}

/**
 * 협업 관계 — 두 조직 간 구조적 협력 관계.
 * CollabCase(실적 기록)와 달리 관계의 유형·강도·잠재성을 명시한다.
 * 시드: src/data/collab_relations.json
 */
export interface CollabRelation {
  id: string;
  org_a_id: string;
  org_b_id: string;
  org_a_subgroup: SubgroupCode;
  org_b_subgroup: SubgroupCode;
  /** "A5 × A4" 형식의 하위그룹 쌍 표기 */
  pair_code: string;
  /** 관계 유형: 서비스결합·자원공유·공동전환·표준화협력·금융연계·공공연계·역량강화·경험이전·전문서비스·투자유치·정책연구 */
  relation_type: string;
  domain_tags: number[];
  /** 0..1 협력 강도 */
  strength: number;
  /** 근거가 되는 CollabCase.id (잠재 관계는 null) */
  basis_case_id: string | null;
  /** true=실제 협력, false=잠재(추정) */
  is_actual: boolean;
  description: string;
}

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
