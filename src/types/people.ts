// People 도메인 — 사람↔사람 매칭의 원천 계약. 사람 1명=벡터 1개가 아니라
// Need/Offer/ImpactIntent를 독립 item으로 두고, 모든 actor가 Need와 Offer를 모두 소유할 수 있다
// (기업가/전문가 역할로 방향을 고정하지 않는다). 표시 역할명은 vocabulary concept_id로만 참조한다.
// 근거: people_match_retrieval_plan.md §3~§5, research_synthesis.md §7, plans/generic-mixing-seahorse.md M0-2
// 시드: src/data/people/*.json(공개층) + src/data/private/people/*.json(민감층 — DAL만 import, T-005)

export interface ActorRef {
  kind: "person" | "organization" | "project";
  id: string;
}

/** 매칭 제약 — required는 hard filter, preferred/open은 랭킹 신호 (벡터에 넣지 않는다) */
export interface ConstraintV1 {
  kind: "region" | "mode" | "language" | "availability" | "role" | "other";
  strength: "required" | "preferred" | "open";
  values: string[];
}

/** AI 추출값 공통 provenance — user_confirmed_at 없는 값은 추천·임베딩에 쓰지 않는다 */
export interface ExtractedField<T> {
  value: T;
  source_ref: string;
  source_span?: { start: number; end: number };
  confidence: number;
  extracted_by: { provider: string; model: string; prompt_version: string };
  visibility: "public" | "matching_private" | "system_private";
  user_confirmed_at?: string;
}

/** 복수·맥락별 역할 — 영구 신분이 아니라 "이번 연결에서의 역할" */
export interface RoleAssertionV1 {
  id: string;
  person_id: string;
  /** vocabulary concept_id (예: "nvc.role.activist") — 표시 문자열 저장 금지 */
  concept_id: string;
  vocabulary_version: string;
  context: { kind: "personal" | "organization" | "project"; ref_id?: string };
  acting_capacity:
    | "personal"
    | "organization_member"
    | "organization_representative";
  active_period?: { from?: string; until?: string };
}

/**
 * safe_match_text 승인 영수증 — "user_confirmed" 문자열이나 임의 타임스탬프("x")만으로는
 * 승인을 신뢰하지 않는다. 누가·어느 개정본을·어떤 문구로 승인했는지와 동의 영수증까지 결속해
 * 검증 가능한 형태로 남긴다. 검증 규칙은 src/lib/matching/receipt.ts가 단일 구현.
 * 근거: 재리뷰 REJECT #4, people_match_retrieval_plan.md §5
 */
export interface SafeMatchReceipt {
  /** ISO 8601 승인 시각 — 파싱 실패(예: "x")·범위 밖(1970~2100)이면 무효 */
  confirmed_at: string;
  /** 승인자 person id — need.owner.id와 일치해야 유효(제3자 승인 차단) */
  confirmer_person_id: string;
  /** 승인 당시 프로필 개정 번호 — need.profile_revision과 일치해야 유효 */
  source_revision: number;
  /** 승인 시점 safe_match_text의 sha256 hex — 승인 후 문구 교체를 검출한다 */
  content_hash: string;
  /** 근거가 된 ConsentRecordV1.id — 빈 값이면 무효 */
  consent_receipt_id: string;
}

/**
 * 방향성 query — "지금 함께 풀고 싶은 것". 민감층(본인·운영자·엔진만).
 * detail_quote는 온보딩 원문 그대로(BR-02), 임베딩 입력은 safe_match_text(사용자 승인)만.
 */
export interface NeedIntentV1 {
  id: string;
  owner: ActorRef;
  /** tags.json 로컬 taxonomy id (1..12) — 외부 표준 매핑은 term_mappings로 별도 */
  tag_ids: number[];
  detail_quote: string;
  /** PII 제거 + 사용자 승인을 거친 매칭·소개용 요약문. draft 상태면 임베딩 금지 */
  safe_match_text?: string;
  safe_match_status: "draft" | "user_confirmed";
  /**
   * 승인 영수증 — user_confirmed의 필수 동반. verifySafeMatchReceipt()가 전부 통과할 때만
   * mapper가 safe_match_text를 엔진에 넘긴다(재리뷰 REJECT #4).
   */
  safe_match_receipt?: SafeMatchReceipt;
  priority: "primary" | "normal";
  urgency: "exploring" | "active" | "time_sensitive";
  constraints: ConstraintV1[];
  status: "active" | "paused" | "expired";
  valid_until?: string;
  source: "onboarding" | "operator" | "migration";
  profile_revision: number;
  created_at: string;
}

/** 방향성 candidate — "내가 나눌 수 있는 것". 공개층. */
export interface CapabilityOfferV1 {
  id: string;
  owner: ActorRef;
  tag_ids: number[];
  detail: string;
  /** 제공 자원 유형 — 미상이면 생략(마이그레이션에서 날조 금지) */
  resource_types?: (
    | "expertise"
    | "time"
    | "funding"
    | "space_goods"
    | "data"
    | "network"
  )[];
  evidence_refs?: string[];
  capacity?: { status: "open" | "limited" | "paused"; max_active?: number };
  status: "active" | "paused" | "expired";
  valid_until?: string;
  source: "onboarding" | "operator" | "migration";
  profile_revision: number;
  created_at: string;
}

/** 공통점(거울형) 축 — 만들고 싶은 변화. 공개층. */
export interface ImpactIntentV1 {
  id: string;
  owner: ActorRef;
  /** 원문 미션 문장(공개 시드 유래) */
  change_statement: string;
  /** tags.json 외 분야 축 — fields.json id */
  field_ids: number[];
  geography?: { sido: string; sigungu?: string };
  source: "onboarding" | "operator" | "migration";
  profile_revision: number;
  created_at: string;
}

/** 실행 경험 — M2 대화 인터뷰에서 본격 수집. M0는 계약만 둔다. */
export interface ExperienceV1 {
  id: string;
  person_id: string;
  safe_summary: string;
  period?: string;
  outcome?: string;
  collaborator_types?: string[];
  evidence_refs?: string[];
  visibility: "public" | "matching_private";
  source: "onboarding" | "operator" | "migration";
  created_at: string;
}

export type ConsentPurpose =
  | "publish_profile"
  | "use_private_needs_for_matching"
  | "quote_in_intro"
  | "generate_match_embeddings"
  | "facilitate_introduction"
  | "product_analytics"
  | "model_training"
  | "external_processor_transfer";

/** 목적별 동의 영수증 — 철회 시 관련 벡터·캐시 삭제 cascade 트리거 */
export interface ConsentRecordV1 {
  id: string;
  person_id: string;
  purpose: ConsentPurpose;
  scope?: string;
  processor?: string;
  retention?: string;
  policy_version: string;
  consented_at: string;
  withdrawn_at?: string;
  /** 시드 회원(목업)의 동의는 실제 동의가 아님을 명시 */
  source: "user_action" | "seed_mock";
}
