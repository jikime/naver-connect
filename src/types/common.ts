// 공통 타입 — ViewerContext, 마스킹 DTO, 자동화 3레벨 메타
// 근거: ARCHITECTURE.md §4.2 / §5.1 / §4.2(AutomationMeta), NFR-07/NFR-08

/** 역할 스위처가 만드는 뷰어 컨텍스트. 전 화면 가시성의 단일 입력 (FR-GL-01/02/03). */
export interface ViewerContext {
  role: "기업가" | "전문가" | "운영자";
  /** 현재 페르소나 Member.id */
  personaId: string;
  /** 매칭엔진 뷰는 목업에서 운영자에 포함 */
  isEngine?: false;
}

/** 자동화 3레벨 (NFR-08) */
export type AutomationLevel = "자동" | "보조" | "수동";

/** FR별 [자동]/[보조]/[수동] + 향후 교체 지점 메타 (NFR-08, automationRegistry SSOT) */
export interface AutomationMeta {
  fr_id: string;
  level: AutomationLevel;
  swap_point?: string;
}
