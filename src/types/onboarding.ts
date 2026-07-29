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

/**
 * finalizeOnboarding 입력 — M1: readiness·trust_connections 소실 수정 + 동의 3분리.
 * (store가 스냅샷으로 보존해야 해서 writes.ts가 아닌 타입 배럴에 둔다 — 순환 방지)
 */
export interface OnboardingFinalizeInput {
  /** 스텝1에서 사용자가 확인·수정한 공개 프로필 원값 */
  organization: {
    name: string;
    type: string;
    role: string;
  };
  region: {
    sido: string;
    sigungu: string;
  };
  field_tags: number[];
  value_chain_stage: string;
  mission_statement: string;
  demand_tags: {
    tagId: number;
    priority: boolean;
    detail_quote: string;
    /**
     * M2 P1-1: 사용자가 마지막 확인 화면에서 승인한 매칭용 문구. 승인 의사만 담고,
     * 영수증은 서버(/api/onboarding/safe-text)가 발급한다 — 미승인이면 need는 draft 유지.
     */
    safe_match?: { approved: boolean; text: string };
  }[];
  supply_tags: { tagId: number; detail: string }[];
  activities: string[];
  /** 스텝4에서 선택한 현재 협업 가능 시간 */
  availability: string;
  preferred_mode: string;
  participation_scope: "개인 자격으로 참여" | "소속 기관을 대표해 참여" | null;
  hot_lead: {
    flag: boolean;
    project_summary: string;
    needed_partner: string;
    stage: string;
  } | null;
  /** 무손실: 협업 준비도 원값 */
  readiness: string;
  /** 무손실: 위저드에서 수정된 신뢰 연결점 */
  trust_connections: {
    type: "소개자" | "아는회원" | "소속모임";
    ref: string;
  }[];
  /** 동의 3분리(A 공개 노출 / B 비공개 수요의 매칭 사용 / C 소개 시 원문 인용) */
  consents: {
    publish_profile: boolean;
    use_private_needs_for_matching: boolean;
    quote_in_intro: boolean;
  };
  /** 하위호환(구 단일 체크박스) — consents.publish_profile와 동일 값 */
  visibility_consent: boolean;
}
