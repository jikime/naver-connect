// 매칭 엔진 코어 — 순수 함수. 시드/스토어를 직접 읽지 않고 전부 주입받는다(테스트 용이·T-005 준수).
// 사람 1명=1벡터가 아니라 need→offer 방향 점수 2개를 reciprocal로 결합하고,
// 결합식 3종(min/geometric/harmonic)을 모두 계산해 평가 하니스가 비교한다. 기본 score는 harmonic.
// 근거: people_match_retrieval_plan.md §6, research_synthesis.md §9, plans/generic-mixing-seahorse.md M1-6

import { evaluateHardFilters } from "@/lib/matching/hard-filters";
import {
  bestDirectional,
  combineReciprocal,
  commonScore,
  crossMatchedTokens,
  tokenize,
} from "@/lib/matching/score";
import type {
  CapabilityOfferV1,
  ImpactIntentV1,
  NeedIntentV1,
  RuleWeight,
} from "@/types";

export interface PersonContextLite {
  region: { sido: string; sigungu?: string };
  fieldIds: number[];
  keywords: string[];
  hotLead?: boolean;
}

export interface DeclineRecord {
  fromId: string;
  toId: string;
  reason: "이미아는사이" | "관심없음" | "여력없음" | "접점약함" | "기타";
}

export interface EngineInput {
  personIds: string[];
  needs: NeedIntentV1[];
  offers: CapabilityOfferV1[];
  impactIntents: ImpactIntentV1[];
  personContext: Record<string, PersonContextLite>;
  /** person 단위 연결(소속 조직의 collab_relations에서 파생) */
  orgEdges: { a: string; b: string }[];
  declines: DeclineRecord[];
  hasMatchingConsent: (personId: string) => boolean;
  ruleWeights: RuleWeight[];
  /** tagId → 태그명(설명·키워드용). 미제공 시 id 문자열 사용 */
  tagNames?: Record<number, string>;
}

export interface EnginePair {
  from: string;
  to: string;
  /** 0..1 */
  forward: number;
  reverse: number;
  common: number;
  reciprocal: { min: number; geometric: number; harmonic: number };
  /** 0..100 — harmonic 기본 결합 + 운영자 가중치 반영 */
  score: number;
  axis: "공통점" | "차이점";
  shared_keywords: string[];
  complementary_keywords: string[];
  best: {
    forwardNeedId?: string;
    forwardOfferId?: string;
    reverseNeedId?: string;
    reverseOfferId?: string;
  };
  hot_lead: boolean;
}

export interface EngineOutput {
  pairs: EnginePair[];
  filtered: { from: string; to: string; codes: string[] }[];
}

/** 결합식 대비 common 축의 반영 비율 — 평가 하니스에서 함께 실험한다 */
const RECIPROCAL_WEIGHT = 0.75;
const COMMON_WEIGHT = 0.25;
/** RuleWeight 1단위당 점수(0..1 스케일) — 구 공식 ×12(0..100)와 동일 레버 크기 유지 */
const RULE_WEIGHT_UNIT = 0.12;

function activeOffers(
  input: EngineInput,
  ownerId: string,
): CapabilityOfferV1[] {
  return input.offers.filter(
    (o) =>
      o.owner.id === ownerId &&
      o.status === "active" &&
      o.capacity?.status !== "paused",
  );
}

function activeNeeds(input: EngineInput, ownerId: string): NeedIntentV1[] {
  return input.needs.filter(
    (n) => n.owner.id === ownerId && n.status === "active",
  );
}

function impactOf(
  input: EngineInput,
  ownerId: string,
): ImpactIntentV1 | undefined {
  return input.impactIntents.find((i) => i.owner.id === ownerId);
}

/** 운영자 가중치: 키워드가 pair의 매칭 텍스트 토큰에 걸리면 가중 부여(포함 매칭) */
function ruleWeightBoost(weights: RuleWeight[], pairTokens: string[]): number {
  if (weights.length === 0 || pairTokens.length === 0) return 0;
  let sum = 0;
  for (const { keyword, weight } of weights) {
    const hit = pairTokens.some(
      (t) => t.includes(keyword) || keyword.includes(t),
    );
    if (hit) sum += weight;
  }
  return sum * RULE_WEIGHT_UNIT;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** 전수 방향 pair 평가 — n=8 규모 전제(ANN 없음, people_match_retrieval_plan §6.1). */
export function runEngine(input: EngineInput): EngineOutput {
  const pairs: EnginePair[] = [];
  const filtered: EngineOutput["filtered"] = [];

  for (const from of input.personIds) {
    for (const to of input.personIds) {
      if (from === to) continue;
      const gate = evaluateHardFilters(from, to, input);
      if (!gate.pass) {
        filtered.push({ from, to, codes: gate.codes });
        continue;
      }

      const fwd = bestDirectional(
        activeNeeds(input, from),
        activeOffers(input, to),
      );
      const rev = bestDirectional(
        activeNeeds(input, to),
        activeOffers(input, from),
      );
      const common = commonScore(
        input.personContext[from],
        input.personContext[to],
        impactOf(input, from),
        impactOf(input, to),
        input.orgEdges.some(
          (e) => (e.a === from && e.b === to) || (e.a === to && e.b === from),
        ),
      );
      const reciprocal = combineReciprocal(fwd.score, rev.score);

      // 키워드: 방향 매칭에서 교차된 토큰(보완) + 컨텍스트 공통 토큰(공통)
      const complementary = crossMatchedTokens(
        [fwd.need?.detail_quote ?? "", rev.need?.detail_quote ?? ""].join(" "),
        [fwd.offer?.detail ?? "", rev.offer?.detail ?? ""].join(" "),
      );
      const kwFrom = input.personContext[from]?.keywords ?? [];
      const kwTo = new Set(input.personContext[to]?.keywords ?? []);
      const shared = kwFrom.filter((k) => kwTo.has(k));

      const pairTokens = [
        ...tokenize(fwd.need?.detail_quote ?? ""),
        ...tokenize(fwd.offer?.detail ?? ""),
        ...tokenize(rev.need?.detail_quote ?? ""),
        ...tokenize(rev.offer?.detail ?? ""),
        ...shared,
        ...complementary,
      ];
      const boost = ruleWeightBoost(input.ruleWeights, pairTokens);

      const raw = clamp01(
        RECIPROCAL_WEIGHT * reciprocal.harmonic +
          COMMON_WEIGHT * common +
          boost,
      );
      const score = Math.round(raw * 100);
      if (score <= 0) {
        filtered.push({ from, to, codes: ["NO_SIGNAL"] });
        continue;
      }

      pairs.push({
        from,
        to,
        forward: fwd.score,
        reverse: rev.score,
        common,
        reciprocal,
        score,
        axis: reciprocal.harmonic >= common ? "차이점" : "공통점",
        shared_keywords: shared,
        complementary_keywords: complementary,
        best: {
          forwardNeedId: fwd.need?.id,
          forwardOfferId: fwd.offer?.id,
          reverseNeedId: rev.need?.id,
          reverseOfferId: rev.offer?.id,
        },
        hot_lead:
          input.personContext[from]?.hotLead === true ||
          input.personContext[to]?.hotLead === true,
      });
    }
  }

  pairs.sort(
    (a, b) =>
      b.score - a.score ||
      a.from.localeCompare(b.from) ||
      a.to.localeCompare(b.to),
  );
  return { pairs, filtered };
}
