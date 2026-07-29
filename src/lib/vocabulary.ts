// vocabulary 해석 유틸 — concept_id → 표시 라벨. 표시 문자열을 enum/데이터에 직접 저장하지 않는
// versioned vocabulary의 유일한 해석 지점. blocked 라벨은 어떤 경우에도 표시용으로 반환하지 않는다.
// 근거: research_synthesis.md §6.3, plans/generic-mixing-seahorse.md M0-1
// 시드: src/data/vocabulary/releases/role-terms-1.0.0.json (비민감 참조 데이터 — 마스킹 불요)

import releaseSeed from "@/data/vocabulary/releases/role-terms-1.0.0.json";
import type {
  TermLabelRevision,
  VocabularyReleaseFile,
} from "@/types/vocabulary";

const releaseFile = releaseSeed as VocabularyReleaseFile;

/** 현재 활성 릴리스(파일 전체). 릴리스 추가 시 최신 semver 선택 로직으로 확장한다. */
export function getActiveRelease(): VocabularyReleaseFile {
  return releaseFile;
}

function revisionsOf(conceptId: string): TermLabelRevision[] {
  return releaseFile.label_revisions.filter(
    (rev) => rev.concept_id === conceptId && rev.locale === "ko-KR",
  );
}

function assertKnownConcept(conceptId: string): void {
  if (!releaseFile.concepts.some((c) => c.concept_id === conceptId)) {
    throw new Error(`Unknown vocabulary concept: ${conceptId}`);
  }
}

/**
 * 현재 시점의 표시 라벨(preferred·valid_until 없음)을 해석한다.
 * blocked/deprecated 라벨은 표시용으로 절대 반환하지 않는다(§6.3 운영규칙 4).
 */
export function resolveDisplayLabel(conceptId: string): string {
  assertKnownConcept(conceptId);
  const preferred = revisionsOf(conceptId).find(
    (rev) => rev.label_kind === "preferred" && rev.valid_until === undefined,
  );
  if (!preferred) {
    throw new Error(`No active preferred label for concept: ${conceptId}`);
  }
  return preferred.label;
}

/**
 * 특정 시점(at) 기준의 라벨 스냅샷을 해석한다 — 과거 이벤트/기록을 당시 화면대로 재현(§6.3 운영규칙 3).
 * 당시 유효(valid_from ≤ at < valid_until)했던 revision 중 가장 최근 valid_from을 선택한다.
 */
export function resolveLabelAt(conceptId: string, at: string): string {
  assertKnownConcept(conceptId);
  const t = Date.parse(at);
  const candidates = revisionsOf(conceptId)
    .filter(
      (rev) =>
        Date.parse(rev.valid_from) <= t &&
        (rev.valid_until === undefined || t < Date.parse(rev.valid_until)),
    )
    .sort((a, b) => Date.parse(b.valid_from) - Date.parse(a.valid_from));
  const hit = candidates[0];
  if (!hit) {
    throw new Error(`No label valid at ${at} for concept: ${conceptId}`);
  }
  return hit.label;
}

/**
 * 라벨 → concept_id 역방향 검색. preferred·alternative·deprecated·blocked 전부 허용
 * (검색과 과거 데이터 해석은 alias를 받는다 — §6.3 운영규칙 4). 미등록 라벨은 undefined.
 */
export function findConceptIdByLabel(label: string): string | undefined {
  const needle = label.trim();
  return releaseFile.label_revisions.find((rev) => rev.label === needle)
    ?.concept_id;
}

/** canonical_code(API/분석용) → concept_id. */
export function findConceptIdByCanonicalCode(code: string): string | undefined {
  return releaseFile.concepts.find((c) => c.canonical_code === code)
    ?.concept_id;
}
