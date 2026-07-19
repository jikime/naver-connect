// DAL: 매칭 점수·추천 룰 read/write — 관리자 가중치 편집 + 재산출 시뮬레이션.
// 근거: ARCHITECTURE.md §4.2/§5.2/§5.3, FR-RL-01~03. 회원 쌍 매칭 근거라 민감 시드(ADR-03).
// 시드: src/data/private/match_scores.json — members.keyword_set 에서 유도 [창작 목업]

import matchScoresSeed from "@/data/private/match_scores.json";
import { ForbiddenError } from "@/lib/dal/errors";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  MatchScore,
  MatchScoresSeed,
  RuleWeight,
  ViewerContext,
} from "@/types";

const seed = matchScoresSeed as MatchScoresSeed;

/**
 * 현재 활성 가중치(세션에서 관리자가 편집했으면 그 값, 아니면 시드 원본)로 점수를 재산출한다
 * (FR-RL-03 시뮬레이션). score = 기본 40 + (공통/차이 키워드에 매칭되는 가중치 합) × 12,
 * 0..100으로 clamp — 실제 매칭엔진 대체 전 "그럴듯한" 재계산 흉내(A10 창작 예외).
 */
function recompute(score: MatchScore, weights: RuleWeight[]): MatchScore {
  const weightOf = (keyword: string) =>
    weights.find((w) => w.keyword === keyword)?.weight ?? 0;
  const keywordSum = [
    ...score.shared_keywords,
    ...score.complementary_keywords,
  ].reduce((sum, keyword) => sum + weightOf(keyword), 0);
  const nextScore = Math.round(40 + keywordSum * 12);
  return { ...score, score: Math.max(0, Math.min(100, nextScore)) };
}

/** 매칭 점수·키워드·현재 가중치 조회(FR-RL-01). 가중치 세션 편집분이 있으면 반영해 재산출한다. */
export async function getMatchScores(
  _vc: ViewerContext,
): Promise<{ scores: MatchScore[]; weights: RuleWeight[] }> {
  const weights =
    useSessionInteractionStore.getState().ruleWeightOverrides ??
    seed.rule_weights;
  return {
    scores: seed.scores.map((score) => recompute(score, weights)),
    weights,
  };
}

/**
 * 관리자 가중치 편집(FR-RL-02) + 재산출 시뮬레이션(FR-RL-03). 운영자가 아니면 403 시뮬레이션.
 * 세션 스토어만 갱신(서버 호출 없음, NFR-02) — 새로고침 시 시드 원본으로 리셋(A6).
 */
export async function setRuleWeights(
  vc: ViewerContext,
  weights: RuleWeight[],
): Promise<{ scores: MatchScore[]; weights: RuleWeight[] }> {
  if (vc.role !== "운영자") {
    throw new ForbiddenError();
  }
  useSessionInteractionStore.getState().setRuleWeightOverrides(weights);
  return getMatchScores(vc);
}
