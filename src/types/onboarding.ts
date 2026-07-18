// 온보딩 — 12태그 + 정적 인터뷰 스크립트 (C-2 해소 · A9 근거)
// 근거: ARCHITECTURE.md §4.2, FR-DA-03, FR-ON-05/06/07/10, BR-10
// 시드: src/data/tags.json, src/data/interview_scripts.json (비민감)

/** 12개 공통 태그 (수요/공급 쌍). 정확히 12개 고정, 11번 반반 구성 주석 보존. */
export interface Tag {
  /** 1..12 */
  id: number;
  name: string;
  /** 수요측이 찾는 것 */
  demand_desc: string;
  /** 공급측이 주는 것 */
  supply_desc: string;
  /** 11번(현장·실증 접점) 반반 구성 등 설명 주석 */
  _comment?: string;
}

/** 태그별 온보딩 후속질문 라이브러리 (analysis-stage1 도출, 창작 아님) */
export interface InterviewScript {
  /** 1..12 */
  tag_id: number;
  /** FR-ON-06 수요 질문 */
  demand_questions: { text: string; example_answer: string }[];
  supply_questions: { text: string; example_answer: string }[];
}

/** 온보딩 스크립트 전역 메타 */
export interface OnboardingScriptMeta {
  /** 3개 (FR-ON-05, BR-03 +3) */
  hot_lead_deep_questions: string[];
  /** FR-ON-07 "공개 프로필에 안 나감" */
  sensitive_notice: string;
  closing_script: string;
  /** FR-ON-10 UI 개발자 노트 */
  llm_swap_note: string;
}

/** interview_scripts.json 파일 전체 구조 (getInterviewScript / getOnboardingMeta 소스) */
export interface InterviewScriptsSeed {
  _comment?: string;
  meta: OnboardingScriptMeta;
  scripts: InterviewScript[];
}
