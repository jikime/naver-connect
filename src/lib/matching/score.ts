// 방향 점수·공통 점수·reciprocal 결합 — 전부 0..1 스케일 순수 함수.
// 텍스트 항의 입력은 EngineNeed.match_text(사용자 승인 safe_match_text)와 공개 offer.detail뿐 —
// 비공개 원문(detail_quote)은 타입 레벨에서 배제된다(safe-text-only 계약).
// M2에서 dense 유사도가 텍스트 항을 대체(shadow 비교)한다.
// 근거: people_match_retrieval_plan.md §6.2, codex-review-eof-pointer-and-safe-text-blocker

import type {
  EngineNeed,
  EngineOffer,
  PersonContextLite,
} from "@/lib/matching/engine";
import type { ImpactIntentV1 } from "@/types";

/** 한국어 경량 토큰화 — 2자 이상 어절만. 형태소 분석 없이 포함 매칭으로 보완한다. */
export function tokenize(text: string): string[] {
  return text
    .split(/[\s.,·:;!?"'()[\]{}~\-–—/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/** 두 토큰이 같은 어근을 공유하는지 — 조사 차이(판로/판로를)를 포함 매칭으로 흡수 */
function tokenHit(a: string, b: string): boolean {
  return a === b || a.includes(b) || b.includes(a);
}

/** 텍스트 겹침 0..1 — 교차 매칭 토큰 수 / 짧은 쪽 토큰 수 */
export function textOverlap(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  let hits = 0;
  for (const x of ta) {
    if (tb.some((y) => tokenHit(x, y))) hits += 1;
  }
  return Math.min(1, hits / Math.min(ta.length, tb.length));
}

/** 교차 매칭된 토큰 목록(보완 키워드 표시용) — 중복 제거, 원문 어절 기준 */
export function crossMatchedTokens(a: string, b: string): string[] {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const out = new Set<string>();
  for (const x of ta) {
    for (const y of tb) {
      if (tokenHit(x, y)) out.add(x.length <= y.length ? x : y);
    }
  }
  return [...out].sort();
}

/**
 * need → offer 방향 적합도 0..1.
 * 태그 교차가 기본 신호, 텍스트 항은 승인된 match_text가 있을 때만 가산.
 * 최우선(★)·시급성은 승수.
 */
export function needOfferScore(need: EngineNeed, offer: EngineOffer): number {
  const tagHits = need.tag_ids.filter((t) => offer.tag_ids.includes(t)).length;
  const tagRatio =
    need.tag_ids.length === 0 ? 0 : tagHits / need.tag_ids.length;
  const text = textOverlap(need.match_text, offer.detail);

  // 승수(★·시급성)가 반영될 여지를 남기기 위해 base 상한을 0.85로 둔다
  let base = 0;
  if (tagHits > 0) {
    base = 0.45 + 0.2 * tagRatio + 0.2 * text;
  } else if (text > 0) {
    base = 0.2 * text; // 태그 불일치·어휘만 겹침 — 약한 경로
  } else {
    return 0;
  }

  if (need.priority === "primary") base *= 1.15;
  if (need.urgency === "time_sensitive") base *= 1.1;
  return Math.max(0, Math.min(1, base));
}

export interface DirectionalBest {
  score: number;
  need?: EngineNeed;
  offer?: EngineOffer;
}

/** 방향 점수 = max over (from의 need × to의 offer). 근거 item을 함께 반환(설명용). */
export function bestDirectional(
  needs: EngineNeed[],
  offers: EngineOffer[],
): DirectionalBest {
  let best: DirectionalBest = { score: 0 };
  for (const n of needs) {
    for (const o of offers) {
      const s = needOfferScore(n, o);
      if (s > best.score) best = { score: s, need: n, offer: o };
    }
  }
  return best;
}

/** 공통점(거울형) 축 0..1 — 분야 Jaccard + 지역 근접 + 미션 어휘 + 조직 그래프 연결 */
export function commonScore(
  a: PersonContextLite | undefined,
  b: PersonContextLite | undefined,
  impactA: ImpactIntentV1 | undefined,
  impactB: ImpactIntentV1 | undefined,
  orgConnected: boolean,
): number {
  if (!a || !b) return 0;
  let s = 0;

  const fa = new Set(a.fieldIds);
  const inter = b.fieldIds.filter((f) => fa.has(f)).length;
  const union = new Set([...a.fieldIds, ...b.fieldIds]).size;
  if (union > 0) s += 0.35 * (inter / union);

  if (a.region.sido === b.region.sido) {
    s += 0.2;
    if (a.region.sigungu && a.region.sigungu === b.region.sigungu) s += 0.1;
  }

  if (impactA && impactB) {
    s += 0.25 * textOverlap(impactA.change_statement, impactB.change_statement);
  }

  if (orgConnected) s += 0.2;
  return Math.max(0, Math.min(1, s));
}

export interface ReciprocalScores {
  min: number;
  geometric: number;
  harmonic: number;
}

/**
 * 양방향 결합 3종 — 한쪽이 0이면 전부 0(일방적 매칭 억제).
 * 어떤 식을 정본으로 쓸지는 gold set 비교로 결정한다(§6.2 — 미리 고정하지 않음).
 */
export function combineReciprocal(f: number, r: number): ReciprocalScores {
  if (f <= 0 || r <= 0) return { min: 0, geometric: 0, harmonic: 0 };
  return {
    min: Math.min(f, r),
    geometric: Math.sqrt(f * r),
    harmonic: (2 * f * r) / (f + r),
  };
}
