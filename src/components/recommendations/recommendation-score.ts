import type { MatchScore, Recommendation } from "@/types";

export function scoreForRecommendation(
  recommendation: Recommendation,
  scoresByPair: Map<string, MatchScore>,
): MatchScore | undefined {
  const direct = scoresByPair.get(
    `${recommendation.from_member_id}→${recommendation.to_member_id ?? ""}`,
  );
  if (!recommendation.to_member_id) return direct;
  const reverse = scoresByPair.get(
    `${recommendation.to_member_id}→${recommendation.from_member_id}`,
  );
  // 엔진 추천 DTO는 수신자를 to_member_id에 두므로 엔진 평가 pair와 방향이 반대다.
  return recommendation.source === "engine"
    ? (reverse ?? direct)
    : (direct ?? reverse);
}
