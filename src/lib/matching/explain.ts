// evidence-grounded 설명 — LLM 창작 없이 점수에 실제로 쓰인 item 포인터로 4요소를 조립한다.
// 텍스트 인용은 승인된 match_text(safe_match_text)와 공개 offer.detail만 —
// 비공개 원문(detail_quote)은 엔진 입력에 존재하지 않아 구조적으로 인용 불가(safe-text-only).
// 근거: people_match_retrieval_plan.md §6.3, codex-review-eof-pointer-and-safe-text-blocker

import type { EngineInput, EnginePair } from "@/lib/matching/engine";

export interface ExplanationPart {
  /** 근거 item id (need/offer) — recommendation_candidates.reason_codes로 저장 */
  ref?: string;
  text: string;
}

export interface PairExplanation {
  your_need: ExplanationPart;
  their_offer: ExplanationPart;
  their_benefit: ExplanationPart;
  first_action: ExplanationPart;
}

function tagLabel(input: EngineInput, tagIds: number[] | undefined): string {
  if (!tagIds || tagIds.length === 0) return "협업";
  const names = tagIds.map((id) => input.tagNames?.[id] ?? `분야 ${id}`);
  return names.join("·");
}

/** from(받는 사람) 관점의 설명. pair.best 포인터만 사용 — 점수에 안 쓴 근거는 말하지 않는다. */
export function buildExplanation(
  pair: EnginePair,
  input: EngineInput,
): PairExplanation {
  const fwdNeed = input.needs.find((n) => n.id === pair.best.forwardNeedId);
  const fwdOffer = input.offers.find((o) => o.id === pair.best.forwardOfferId);
  const revNeed = input.needs.find((n) => n.id === pair.best.reverseNeedId);

  // 승인된 match_text가 있으면 인용, 없으면(draft) 태그 수준으로만 — 원문 인용 경로 없음
  const your_need: ExplanationPart = fwdNeed
    ? {
        ref: fwdNeed.id,
        text: fwdNeed.match_text
          ? `"${fwdNeed.match_text}" — 지금 가장 필요한 연결이에요.`
          : `지금 '${tagLabel(input, fwdNeed.tag_ids)}' 연결이 가장 필요한 시점이에요.`,
      }
    : {
        text: "공통의 관심사가 커서 대화가 빨리 붙는 조합이에요.",
      };

  const their_offer: ExplanationPart = fwdOffer
    ? {
        ref: fwdOffer.id,
        text: `상대는 "${fwdOffer.detail}"을(를) 나눌 수 있다고 공개했어요.`,
      }
    : {
        text: "상대의 공개 프로필이 당신의 활동 반경과 겹칩니다.",
      };

  // 상대 이익: 상대의 승인 텍스트가 있어도 태그 수준으로만 (min exposure — 상호 수락 전)
  const their_benefit: ExplanationPart = revNeed
    ? {
        ref: revNeed.id,
        text: `상대도 지금 '${tagLabel(input, revNeed.tag_ids)}' 연결을 찾고 있어, 당신의 제안이 반가운 시점이에요.`,
      }
    : {
        text: "상대에게도 새로운 분야의 접점이 생기는 연결이에요.",
      };

  const first_action: ExplanationPart = {
    text:
      pair.axis === "차이점"
        ? `'${tagLabel(input, fwdNeed?.tag_ids)}' 상황을 안건으로 15분 통화부터 — 무겁지 않게 시작하세요.`
        : "가벼운 커피챗 15분으로 서로의 진행 상황을 나눠보세요.",
  };

  return { your_need, their_offer, their_benefit, first_action };
}
