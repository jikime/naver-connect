// 매칭 점수·키워드 가중치 (v1.1 신규 시드) [창작 목업] · 민감(src/data/private/)
// 근거: ARCHITECTURE.md §4.2, FR-RL-01~03, FR-RC-01
// 시드: src/data/private/match_scores.json — members.keyword_set 에서 유도, 회원 쌍 점수라 민감 격리.

export interface MatchScore {
  from_member_id: string;
  to_member_id: string;
  /** 0..100, 가중치 변경 시 재산출(FR-RL-03 시뮬레이션) */
  score: number;
  /** 공통점 축 근거(FR-RC-01 "공통점 많은 5명") */
  shared_keywords: string[];
  /** 차이점 축 근거(FR-RC-01 "차이점 많은 5명") */
  complementary_keywords: string[];
  /** FR-RC-01 그룹핑 축 */
  axis: "공통점" | "차이점";
}

/** FR-RL-02 관리자 가중치 편집(세션 한정) */
export interface RuleWeight {
  keyword: string;
  weight: number;
}

/** match_scores.json 파일 전체 구조 (getMatchScores / getRuleWeights 소스) */
export interface MatchScoresSeed {
  _comment?: string;
  scores: MatchScore[];
  rule_weights: RuleWeight[];
}
