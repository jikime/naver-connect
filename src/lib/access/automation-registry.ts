// automationRegistry — FR별 [자동]/[보조]/[수동] + 향후 교체 지점(swap_point) 단일 소스.
// 근거: ARCHITECTURE.md §3(L6 AUTOREG)·§6 NFR-08·§10 Traceability(전 FR 56종 자동화 열).
// `AutomationLevelBadge`(T-007/T-008)가 이 레지스트리를 소스로 화면에 렌더한다.

import type { AutomationLevel, AutomationMeta } from "@/types";

/** §10 추적성 표의 자동화 열을 그대로 옮긴 SSOT. 56개 FR 전건. */
export const AUTOMATION_REGISTRY: AutomationMeta[] = [
  { fr_id: "FR-ON-01", level: "수동" },
  { fr_id: "FR-ON-02", level: "수동" },
  { fr_id: "FR-ON-03", level: "수동" },
  { fr_id: "FR-ON-04", level: "수동" },
  {
    fr_id: "FR-ON-05",
    level: "보조",
    swap_point: "정적 핫리드 심화질문 3개 → LLM 동적 후속질문 생성(FR-ON-10)",
  },
  {
    fr_id: "FR-ON-06",
    level: "보조",
    swap_point:
      "interview_scripts.json 정적 스크립트 → LLM 후속질문 생성(FR-ON-10)",
  },
  { fr_id: "FR-ON-07", level: "수동" },
  { fr_id: "FR-ON-08", level: "수동" },
  {
    fr_id: "FR-ON-09",
    level: "보조",
    swap_point: "finalizeOnboarding(세션 스토어) → POST /onboarding/finalize",
  },
  {
    fr_id: "FR-ON-10",
    level: "수동",
    swap_point: "온보딩 정적 분기 전체 → LLM API 추론(§1 점선 LLM)",
  },
  { fr_id: "FR-ON-11", level: "보조" },
  { fr_id: "FR-RC-01", level: "자동" },
  { fr_id: "FR-RC-02", level: "자동" },
  { fr_id: "FR-RC-03", level: "자동" },
  { fr_id: "FR-RC-04", level: "자동" },
  { fr_id: "FR-RC-05", level: "수동" },
  { fr_id: "FR-RC-06", level: "자동" },
  { fr_id: "FR-RC-07", level: "자동" },
  {
    fr_id: "FR-RC-08",
    level: "자동",
    swap_point: "공공중간지원 정적 분기 → 매칭엔진 실추론 + 공공DB 연계",
  },
  { fr_id: "FR-FB-01", level: "수동" },
  {
    fr_id: "FR-FB-02",
    level: "자동",
    swap_point: "엔진 반영 안내 문구 → 매칭엔진 실호출(빈도/가중치 반영)",
  },
  { fr_id: "FR-FB-03", level: "수동" },
  { fr_id: "FR-FB-04", level: "수동" },
  {
    fr_id: "FR-OP-01",
    level: "보조",
    swap_point: "getReviewQueue/approveRecommendation → REST API",
  },
  { fr_id: "FR-OP-02", level: "수동" },
  { fr_id: "FR-OP-03", level: "자동" },
  { fr_id: "FR-OP-04", level: "수동" },
  { fr_id: "FR-GL-01", level: "수동" },
  { fr_id: "FR-GL-02", level: "자동" },
  { fr_id: "FR-GL-03", level: "자동" },
  { fr_id: "FR-GL-04", level: "수동" },
  { fr_id: "FR-GR-01", level: "자동" },
  { fr_id: "FR-GR-02", level: "자동" },
  { fr_id: "FR-GR-03", level: "자동" },
  { fr_id: "FR-GR-04", level: "자동" },
  {
    fr_id: "FR-GR-05",
    level: "자동",
    swap_point:
      "정적 기회카드 → 공공DB/외부공고 크롤링 파이프라인(§1 점선 PUB)",
  },
  { fr_id: "FR-GR-06", level: "수동" },
  { fr_id: "FR-GR-07", level: "자동" },
  {
    fr_id: "FR-DR-01",
    level: "자동",
    swap_point: "getDealRooms → REST API",
  },
  { fr_id: "FR-DR-02", level: "자동" },
  { fr_id: "FR-DR-03", level: "자동" },
  {
    fr_id: "FR-DR-04",
    level: "자동",
    swap_point:
      "정적 스텁(편집 없음) → 딜룸 내부 편집·상태 전이 기능(Out of Scope 해제 시)",
  },
  {
    fr_id: "FR-BO-01",
    level: "자동",
    swap_point: "getExpertServices → REST API",
  },
  { fr_id: "FR-BO-02", level: "자동" },
  { fr_id: "FR-BO-03", level: "자동" },
  { fr_id: "FR-BO-04", level: "자동" },
  { fr_id: "FR-BO-05", level: "자동" },
  { fr_id: "FR-KP-01", level: "자동", swap_point: "getKpis → REST API" },
  { fr_id: "FR-KP-02", level: "자동" },
  { fr_id: "FR-KP-03", level: "자동" },
  { fr_id: "FR-DA-01", level: "자동" },
  {
    fr_id: "FR-DA-02",
    level: "자동",
    swap_point:
      "DAL 전 함수(Promise+ViewerContext 계약 유지) → 백엔드 REST API(§1 점선 API)",
  },
  { fr_id: "FR-DA-03", level: "자동" },
  { fr_id: "FR-EM-01", level: "자동" },
  { fr_id: "FR-EM-02", level: "수동" },
  { fr_id: "FR-EM-03", level: "자동" },
];

/** FR 단건 조회. */
export function getAutomationMeta(frId: string): AutomationMeta | undefined {
  return AUTOMATION_REGISTRY.find((meta) => meta.fr_id === frId);
}

/** FR의 자동화 레벨만 조회(없으면 undefined). */
export function getAutomationLevel(frId: string): AutomationLevel | undefined {
  return getAutomationMeta(frId)?.level;
}
