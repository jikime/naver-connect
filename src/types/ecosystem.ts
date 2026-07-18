// 생태계 그래프 (2단계) — Field / VCStage / Organization / Resource / Opportunity + 엣지
// 근거: ARCHITECTURE.md §4.2, FR-GR-*, FR-EM-01, BR-11
// 시드: fields / field_links / vc_stages / stage_links / organizations / resources / opportunities.json (비민감)

/** 8분야 + 확장 5 */
export interface Field {
  id: number;
  name: string;
  definition: string;
  is_extension: boolean;
}

/** 분야간 연계강도 (대칭). ●강 / ◐중 / ○약 */
export interface FieldLink {
  from_field: number;
  to_field: number;
  strength: "●" | "◐" | "○";
  _comment?: string;
}

/** 밸류체인 단계 */
export interface VCStage {
  id: number;
  field_id: number;
  name: string;
  key_activity: string;
  revenue_source: string;
  success_factor: string;
  meta_stage: "발굴·기획" | "생산·제공" | "유통·연계" | "운영·평가";
  /** 단위경제 수치 */
  unit_economics?: string;
}

/** STAGE_LINK 사전 — 9개 (FR-GR-02 실선/점선) */
export interface StageLink {
  id: number;
  from_stage: number;
  to_stage: number;
  resource_flow: string;
  rationale: string;
  status: "실제" | "잠재";
  evidence_source: string;
}

/** 주체 조직 ≈40개 (N-8 해소: region·field_tags 필수) */
export interface Organization {
  id: string;
  name: string;
  region: { sido: string; sigungu: string };
  field_tags: number[];
  value_chain_stage_id: number;
  /** 4층 필수 태깅 */
  actor_type: "공공" | "중간지원" | "사회적경제" | "영리플랫폼";
  /** 0..1 */
  ai_confidence: number;
  source: string;
  verified_by: string[];
  last_checked_at: string;
  member_id: string | null;
}

/** 상시 제도 재원 (BR-11) */
export interface Resource {
  id: string;
  name: string;
  nature: "자기조직형" | "정책의존형" | "중간형";
  field_tags: number[];
  freshness_cycle: string;
}

/** 마감 있는 이벤트성 재원 (BR-11) */
export interface Opportunity {
  id: string;
  source:
    | "나라장터"
    | "사회적기업진흥원"
    | "K-스타트업"
    | "사회적경제지원센터"
    | "기업CSR"
    | "금융";
  field: string;
  region: string;
  target_requirement: string;
  deadline: string;
  consortium_required: boolean;
  budget_scale: string;
}
