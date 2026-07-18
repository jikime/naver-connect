// Recommendation — 1:1 + 모듬 변형(N-7, 18번째 시드 없이 수용, ADR-06)
// 근거: ARCHITECTURE.md §4.2, FR-RC-01~08, FR-FB-*
// 시드: src/data/private/recommendations.json (민감 — contact_point 가 비공개 수요 원문 인용)

export type MatchType = "거울형" | "퍼즐형" | "다리형" | "취미형" | "선배형";
export type RecStatus =
  | "draft"
  | "pending_review"
  | "sent"
  | "accepted"
  | "declined"
  | "rejected";
/** FR-RC-01 유형 혼합 표시 */
export type RecValueClass = "사업가치" | "동료성장가치" | "관계가치";

export type DeclineReasonCode =
  | "여력없음"
  | "접점약함"
  | "이미아는사이"
  | "관심없음"
  | "기타";

export interface Recommendation {
  id: string;
  /** N-7: 모듬 변형 판별 */
  rec_kind: "1:1" | "모듬";
  from_member_id: string;
  /** 모듬이면 null */
  to_member_id: string | null;
  match_type: MatchType;
  value_class: RecValueClass;
  matching_rationale: string;
  /** FR-RC-03 5문장, BR-06 (받는사람 이익 먼저) */
  message: {
    intro: string;
    /** contact_point = 온보딩 원문 인용 (BR-02) */
    contact_point: string;
    your_benefit: string;
    their_benefit: string;
    first_action: string;
  };
  /** FR-RC-02 퍼즐형 우선 */
  is_hot_lead: boolean;
  /** FR-RC-06 최소 노출 인용 범위(예: "판로를 찾고 계신 A님") */
  min_exposure_note: string;
  /** FR-RC-07 개별 작성(복붙 대칭 금지) */
  authored_direction: "A→B" | "B→A";
  /** rec_kind==="모듬" 일 때만 */
  meetup?: {
    meetup_id: string;
    type: "학습모임" | "취미모임" | "지역앰배서더" | "공공모듬";
    purpose: string;
    member_ids: string[];
  };
  sent_week: string;
  /** FR-OP-04 상태 전이 */
  status: RecStatus;
  /** FR-FB-01 */
  decline_reason?: DeclineReasonCode;
  /** FR-FB-03 (기타) */
  decline_note?: string;
  /** FR-FB-04 */
  meeting_outcome?: { met: boolean; will_meet_again: boolean; note: string };
}

/** decline_reasons.json (FR-FB-01/02) */
export interface DeclineReason {
  code: DeclineReasonCode;
  label: string;
  engine_effect:
    | "빈도하향"
    | "가중치하향"
    | "관계엣지생성"
    | "보정플래그"
    | "수동분류";
  /** 목업은 반영 결과 안내만 */
  effect_desc: string;
}
