// safe-match 승인 영수증 유닛 — 승인 provenance가 "문자열이 있기만 하면 통과"하지 않는지 검증한다.
// 재리뷰 REJECT #4: safe_match_confirmed_at="x"도 통과하던 계약을 승인자·개정본·문구 해시·
// 동의 영수증 4중 결속으로 대체했다. 하나라도 어긋나면 match_text는 비어야 한다(fail-closed).
// 근거: 재리뷰 REJECT #4, people_match_retrieval_plan.md §5~§6

import { describe, expect, it } from "vitest";
import {
  hashSafeMatchText,
  issueSafeMatchReceipt,
  toEngineNeed,
  verifySafeMatchReceipt,
} from "@/lib/matching/receipt";
import type { NeedIntentV1 } from "@/types";

const CONFIRMED_AT = "2026-07-29T13:00:00+09:00";
const CONSENT_ID = "CONSENT-M-001-matching";

/** 승인 직전 상태의 need — 영수증만 붙이면 유효해지는 기준 픽스처 */
function baseNeed(over: Partial<NeedIntentV1> = {}): NeedIntentV1 {
  return {
    id: "need-receipt-1",
    owner: { kind: "person", id: "M-001" },
    tag_ids: [4],
    detail_quote: "원문 — 엔진에 절대 들어가면 안 되는 민감층 문장",
    safe_match_text: "승인된 매칭 요약문",
    safe_match_status: "user_confirmed",
    priority: "primary",
    urgency: "active",
    constraints: [],
    status: "active",
    source: "onboarding",
    profile_revision: 2,
    created_at: CONFIRMED_AT,
    ...over,
  };
}

/** 정상 발급본 — 본인이 현재 개정본·현재 문구로 승인한 상태 */
function confirmedNeed(over: Partial<NeedIntentV1> = {}): NeedIntentV1 {
  const need = baseNeed(over);
  return {
    ...need,
    safe_match_receipt: issueSafeMatchReceipt(
      need,
      need.owner.id,
      CONSENT_ID,
      CONFIRMED_AT,
    ),
  };
}

/** 픽스처 헬퍼 — 정상 발급본의 영수증을 꺼내 필드 하나만 어긋나게 만든다(engine.test.ts must() 선례) */
function tamper(
  need: NeedIntentV1,
  over: Partial<NonNullable<NeedIntentV1["safe_match_receipt"]>>,
): NeedIntentV1 {
  const receipt = need.safe_match_receipt;
  if (!receipt) throw new Error("fixture must carry a receipt");
  return { ...need, safe_match_receipt: { ...receipt, ...over } };
}

describe("safe-match 영수증 — 발급·검증", () => {
  it("정상 발급된 영수증은 검증을 통과한다", () => {
    const need = confirmedNeed();
    expect(need.safe_match_receipt?.content_hash).toBe(
      hashSafeMatchText("승인된 매칭 요약문"),
    );
    expect(verifySafeMatchReceipt(need)).toBe(true);
  });

  it('confirmed_at이 "x"처럼 파싱 불가한 문자열이면 거부한다', () => {
    expect(
      verifySafeMatchReceipt(tamper(confirmedNeed(), { confirmed_at: "x" })),
    ).toBe(false);
  });

  it("confirmed_at이 1970~2100 범위를 벗어나면 거부한다", () => {
    expect(
      verifySafeMatchReceipt(
        tamper(confirmedNeed(), { confirmed_at: "1899-01-01T00:00:00Z" }),
      ),
    ).toBe(false);
  });

  it("승인자가 need의 owner가 아니면 거부한다 (제3자 승인 차단)", () => {
    expect(
      verifySafeMatchReceipt(
        tamper(confirmedNeed(), { confirmer_person_id: "M-002" }),
      ),
    ).toBe(false);
  });

  it("source_revision이 현재 profile_revision과 다르면 거부한다 (구버전 승인 재사용 차단)", () => {
    const need = confirmedNeed();
    const stale: NeedIntentV1 = { ...need, profile_revision: 3 };
    expect(verifySafeMatchReceipt(stale)).toBe(false);
  });

  it("승인 후 safe_match_text가 바뀌면 content_hash 불일치로 거부한다", () => {
    const need = confirmedNeed();
    const swapped: NeedIntentV1 = {
      ...need,
      safe_match_text: "승인 뒤 몰래 바꿔치기한 문구",
    };
    expect(verifySafeMatchReceipt(swapped)).toBe(false);
  });

  it("consent_receipt_id가 비어 있으면 거부한다", () => {
    expect(
      verifySafeMatchReceipt(
        tamper(confirmedNeed(), { consent_receipt_id: "   " }),
      ),
    ).toBe(false);
  });

  it("영수증 자체가 없으면 status가 user_confirmed여도 거부한다", () => {
    expect(verifySafeMatchReceipt(baseNeed())).toBe(false);
  });

  it("status가 draft면 영수증이 있어도 거부한다", () => {
    expect(
      verifySafeMatchReceipt({
        ...confirmedNeed(),
        safe_match_status: "draft",
      }),
    ).toBe(false);
  });
});

describe("safe-match 영수증 — toEngineNeed mapper", () => {
  const allow = () => true;
  const deny = () => false;

  it("영수증 검증 통과 + 매칭 동의(B)가 있어야 match_text를 싣는다", () => {
    expect(toEngineNeed(confirmedNeed(), allow).match_text).toBe(
      "승인된 매칭 요약문",
    );
  });

  it("영수증 검증이 실패하면 match_text를 비운다", () => {
    expect(toEngineNeed(baseNeed(), allow).match_text).toBe("");
    expect(
      toEngineNeed({ ...confirmedNeed(), profile_revision: 9 }, allow)
        .match_text,
    ).toBe("");
  });

  it("매칭 동의(B)가 없으면 영수증이 유효해도 match_text를 비운다", () => {
    expect(toEngineNeed(confirmedNeed(), deny).match_text).toBe("");
  });

  it("엔진 DTO에는 detail_quote·영수증 필드가 실리지 않는다", () => {
    const dto = toEngineNeed(confirmedNeed(), allow);
    expect("detail_quote" in dto).toBe(false);
    expect("safe_match_receipt" in dto).toBe(false);
  });
});

describe("safe-match 영수증 — consent 영수증 해석 검증(M2 온보딩 보완 #1)", () => {
  // Codex 보완 #1: consent_receipt_id "비어있지 않음"만으로는 부족 — 해석기(resolver)가
  // 실제 동의 레코드(person·purpose·withdrawn_at)를 확인해야 한다.
  const resolverAllowing =
    (validId: string) => (receiptId: string, ownerId: string) =>
      receiptId === validId && ownerId === "M-001";

  it("resolver가 주어지면 consent_receipt_id가 실제 동의로 해석돼야 통과한다", () => {
    const need = confirmedNeed();
    const validId = need.safe_match_receipt?.consent_receipt_id ?? "";
    expect(verifySafeMatchReceipt(need, resolverAllowing(validId))).toBe(true);
    expect(
      verifySafeMatchReceipt(need, resolverAllowing("consent-없는-id")),
    ).toBe(false);
  });

  it("resolver 거부는 toEngineNeed에서도 match_text를 비운다", () => {
    const allow = () => true;
    expect(toEngineNeed(confirmedNeed(), allow, () => false).match_text).toBe(
      "",
    );
  });
});
