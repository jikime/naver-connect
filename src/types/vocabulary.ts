// Versioned vocabulary — 역할·표현 용어의 버전 관리 계약.
// 표시 문자열을 사용자 데이터/enum에 직접 저장하지 않고, 불변 concept_id + vocabulary_version을
// 저장한 뒤 화면에서 그 시점의 라벨을 해석한다. 라벨은 덮어쓰지 않고 revision을 append한다.
// 근거: research_synthesis.md §6.3, people_match_retrieval_plan.md §4.2, plans/generic-mixing-seahorse.md M0-1
// 시드: src/data/vocabulary/releases/*.json (정본), vocabulary-change-events.jsonl (append-only 이력)

export type TermStatus = "draft" | "in_review" | "active" | "retired";

/** preferred=작성 UI 노출 / alternative=검색 별칭 / deprecated=과거 라벨(검색만) / blocked=표시 금지(과거 해석·검색만) */
export type LabelKind = "preferred" | "alternative" | "deprecated" | "blocked";

export interface VocabularyRelease {
  /** semver, 예: "role-terms/1.0.0" */
  version: string;
  released_at: string;
  /** 합의 근거 문서/블록 ID */
  decision_record_ids: string[];
  approved_by: string[];
}

export interface TermConcept {
  /** immutable, 예: "nvc.role.activist" */
  concept_id: string;
  /** API/분석용 stable code (스네이크케이스) */
  canonical_code: string;
  /** 라벨이 아니라 개념의 의미 정의 */
  definition: string;
  broader_concept_ids?: string[];
  related_concept_ids?: string[];
  status: TermStatus;
}

export interface TermLabelRevision {
  revision_id: string;
  concept_id: string;
  locale: "ko-KR" | "en";
  label: string;
  label_kind: LabelKind;
  valid_from: string;
  valid_until?: string;
  supersedes_revision_id?: string;
  change_reason: string;
  evidence_urls?: string[];
  proposed_by: string;
  approved_by?: string[];
  approved_at?: string;
  migration_note?: string;
}

export interface VocabularyChangeEvent {
  event_id: string;
  event_type:
    | "concept.created"
    | "label.proposed"
    | "label.activated"
    | "label.deprecated"
    | "concept.split"
    | "concept.merged";
  concept_ids: string[];
  from_version?: string;
  to_version: string;
  actor_id: string;
  reason: string;
  occurred_at: string;
}

/** releases/*.json 파일 전체 구조 (getActiveRelease 소스) */
export interface VocabularyReleaseFile {
  _comment?: string;
  release: VocabularyRelease;
  concepts: TermConcept[];
  label_revisions: TermLabelRevision[];
}
