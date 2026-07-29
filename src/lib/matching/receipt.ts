// safe-match 승인 영수증 발급·검증 — 순수 함수 모듈(세션 스토어·동의 조회에 의존하지 않는다).
// 재리뷰 REJECT #4: safe_match_confirmed_at은 "x" 같은 임의 문자열도 통과해 승인 provenance 구실을
// 못 했다. 승인자·개정본·문구 해시·동의 영수증 4중 결속을 검증해야 safe_match_text가 엔진에 들어간다.
// (DDL 계약: scripts/ddl/nvc_schema_draft.sql nvc_need_intents safe_match_* 5컬럼)
// 근거: 재리뷰 REJECT #4, people_match_retrieval_plan.md §5~§6

import { createHash } from "node:crypto";
import type { EngineNeed } from "@/lib/matching/engine";
import type { NeedIntentV1, SafeMatchReceipt } from "@/types";

/** 승인 시각 허용 범위 — 1970-01-01T00:00:00Z ~ 2100-01-01T00:00:00Z */
const MIN_CONFIRMED_AT_MS = Date.UTC(1970, 0, 1);
const MAX_CONFIRMED_AT_MS = Date.UTC(2100, 0, 1);

/** 승인 문구 지문 — 승인 후 텍스트가 바뀌면 해시가 어긋나 검증이 실패한다. */
export function hashSafeMatchText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * 영수증 발급기(승인 UI·테스트용) — 호출 시점의 need.safe_match_text를 기준으로 해시를 고정한다.
 * 발급 자체가 승인의 근거는 아니다: 실제 사용 가부는 항상 verifySafeMatchReceipt()가 판정한다.
 */
export function issueSafeMatchReceipt(
  need: NeedIntentV1,
  confirmerPersonId: string,
  consentReceiptId: string,
  confirmedAt: string,
): SafeMatchReceipt {
  return {
    confirmed_at: confirmedAt,
    confirmer_person_id: confirmerPersonId,
    source_revision: need.profile_revision,
    content_hash: hashSafeMatchText(need.safe_match_text ?? ""),
    consent_receipt_id: consentReceiptId,
  };
}

/**
 * consent_receipt_id 해석기 — 참조가 실제 동의 레코드(본인·매칭 목적·미철회)로
 * 해석되는지 판정한다. 조회처(시드/세션)를 모르는 순수 모듈이라 주입받는다.
 * (M2 온보딩 보완 #1: "비어있지 않음" 검사만으로는 임의 문자열 위조를 못 막는다)
 */
export type ConsentReceiptResolver = (
  consentReceiptId: string,
  ownerId: string,
) => boolean;

/** ISO 8601 파싱 성공 + 1970~2100 범위. "x"·빈 문자열·범위 밖은 전부 무효. */
function isValidConfirmedAt(value: unknown): boolean {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return false;
  return ms >= MIN_CONFIRMED_AT_MS && ms <= MAX_CONFIRMED_AT_MS;
}

/**
 * 영수증 전수 검증 — 하나라도 어긋나면 false(fail-closed).
 * ①status=user_confirmed ②영수증 존재 ③confirmed_at이 유효 ISO ④승인자=owner
 * ⑤source_revision=현재 profile_revision ⑥content_hash=현재 safe_match_text 해시
 * ⑦동의 영수증 참조 존재 + (resolver 주입 시) 실제 동의 레코드로 해석됨.
 */
export function verifySafeMatchReceipt(
  need: NeedIntentV1,
  resolveConsentReceipt?: ConsentReceiptResolver,
): boolean {
  if (need.safe_match_status !== "user_confirmed") return false;
  const receipt = need.safe_match_receipt;
  if (!receipt) return false;
  if (!isValidConfirmedAt(receipt.confirmed_at)) return false;
  if (receipt.confirmer_person_id !== need.owner.id) return false;
  if (receipt.source_revision !== need.profile_revision) return false;
  if (receipt.content_hash !== hashSafeMatchText(need.safe_match_text ?? "")) {
    return false;
  }
  if (
    typeof receipt.consent_receipt_id !== "string" ||
    receipt.consent_receipt_id.trim().length === 0
  ) {
    return false;
  }
  if (
    resolveConsentReceipt &&
    !resolveConsentReceipt(receipt.consent_receipt_id, need.owner.id)
  ) {
    return false;
  }
  return true;
}

/**
 * NeedIntent → 엔진 DTO. match_text는 ①영수증 전수 검증 통과 ②owner의 매칭 동의(B)
 * 두 조건을 모두 만족할 때만 싣는다 — 하나라도 없으면 "".
 * 동의 판정은 주입받는다(순수 함수 유지 — 호출자가 getConsentFlags를 넘긴다).
 */
export function toEngineNeed(
  n: NeedIntentV1,
  hasMatchingConsent: (personId: string) => boolean,
  resolveConsentReceipt?: ConsentReceiptResolver,
): EngineNeed {
  const textAllowed =
    verifySafeMatchReceipt(n, resolveConsentReceipt) &&
    hasMatchingConsent(n.owner.id);
  return {
    id: n.id,
    ownerId: n.owner.id,
    tag_ids: n.tag_ids,
    match_text: textAllowed ? (n.safe_match_text ?? "") : "",
    priority: n.priority,
    urgency: n.urgency,
    constraints: n.constraints,
    status: n.status,
  };
}
