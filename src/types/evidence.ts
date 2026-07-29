// evidence_retrieval_v1 — 사혁넷 블로그 등 외부 승인 코퍼스의 구조화 추출 계약.
// people_matching_v1과 공간 분리(space_id 격리): 여기서 나온 어떤 값도 본인/운영자 확인 전에
// matching feature로 승격되지 않는다. Need/availability는 추론 금지 — claim_kind enum에 존재하지
// 않아 타입 레벨에서 차단된다. 모든 claim은 status="proposed" 고정(확정은 별도 확인 절차).
// 수집 authorization: user_directive 2026-07-29 (inbox user-authorization-blog-collection 블록).
// 근거: people_match_retrieval_plan.md §1.2/§3.2, 부록 A, Codex 분담 지시(2026-07-29)

/** 수집기(Codex)가 전달하는 글 1건 — 입력 계약(JSONL 한 줄 = 한 건) */
export interface EvidencePostInput {
  post_id: string;
  url: string;
  title: string;
  /** 사혁넷 카테고리 번호(사람들=7) */
  category_no: number;
  published_at?: string;
  /** PII(전화·이메일) 제거 후 본문 — 실행기가 재검증한다 */
  body_text: string;
}

export type MentionKind = "person" | "organization" | "skill" | "experience";

/** 본문 내 멘션 — surface 원문과 span을 보존한다(근거 추적) */
export interface EntityMention {
  id: string;
  post_id: string;
  kind: MentionKind;
  /** 본문에 등장한 표기 그대로 */
  surface: string;
  span: { start: number; end: number };
  /** 사전 대조로 정규화된 참조(있을 때만) — 자동 병합 아님, 후보일 뿐 */
  matched_ref?: {
    kind: "organization" | "member" | "tag" | "field";
    id: string;
  };
  confidence: number;
  extractor: { name: string; version: string };
}

/**
 * 프로필 주장 — 외부 글이 서술하는 role/affiliation/skill/experience.
 * Need·availability·연락처는 여기 존재할 수 없다(kind enum 제외).
 * status는 "proposed" 단일값 — 승격은 이 파이프라인 밖(본인/운영자 확인)에서만 일어난다.
 */
export interface ProfileClaim {
  id: string;
  post_id: string;
  subject_surface: string;
  claim_kind: "role" | "affiliation" | "skill" | "experience";
  value: string;
  evidence_span: { start: number; end: number };
  status: "proposed";
  extractor: { name: string; version: string };
}

/**
 * 링크 후보 — 블로그 인물/조직 ↔ 기존 조직80/회원8 대조표.
 * status는 "needs_review" 단일값: merged/confirmed가 enum에 없어 자동 병합이 타입상 불가능.
 */
export interface LinkCandidate {
  id: string;
  post_id: string;
  mention_surface: string;
  candidate: { kind: "organization" | "member"; id: string; name: string };
  match_basis: (
    | "exact_name"
    | "partial_name"
    | "org_name_match"
    | "region_cooccurrence"
    | "keyword_overlap"
  )[];
  /** 근거 문자열(본문 발췌 아님 — 대조 사유 요약) */
  evidence: string[];
  score: number;
  status: "needs_review";
}
