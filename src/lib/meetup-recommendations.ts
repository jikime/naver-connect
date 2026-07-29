import type { Field, MaskedMember, MatchScore, Meetup } from "@/types";

interface PairScore {
  memberIds: [string, string];
  score: number;
  keywords: string[];
}

interface HostRecommendation {
  host: MaskedMember;
  score: number;
  reason: string;
}

const LEADERSHIP_ROLE_PATTERN = /대표|이사장|사무국장|상임이사|파트너/;
const FACILITATION_ACTIVITIES = ["멘토링하기", "공동연구", "학습모임"];

function uniquePairs(scores: MatchScore[]): PairScore[] {
  const pairs = new Map<string, PairScore>();

  for (const score of scores) {
    const memberIds = [score.from_member_id, score.to_member_id].sort() as [
      string,
      string,
    ];
    const key = memberIds.join(":");
    const current = pairs.get(key);
    if (!current || score.score > current.score) {
      pairs.set(key, {
        memberIds,
        score: score.score,
        keywords: [...score.shared_keywords, ...score.complementary_keywords],
      });
    }
  }

  return [...pairs.values()].sort((a, b) => b.score - a.score);
}

function scoreBetween(
  scores: MatchScore[],
  fromMemberId: string,
  toMemberId: string,
): number {
  return (
    scores.find(
      (score) =>
        score.from_member_id === fromMemberId &&
        score.to_member_id === toMemberId,
    )?.score ?? 0
  );
}

function averageConnectionScore(
  memberId: string,
  group: MaskedMember[],
  scores: MatchScore[],
): number {
  const otherMemberIds = group
    .map((member) => member.id)
    .filter((id) => id !== memberId);
  if (otherMemberIds.length === 0) return 0;

  const total = otherMemberIds.reduce(
    (sum, otherMemberId) => sum + scoreBetween(scores, memberId, otherMemberId),
    0,
  );
  return Math.round(total / otherMemberIds.length);
}

/**
 * 모둠 안에서 첫 대화를 이끌 호스트를 추천한다.
 * 공개 프로필만 사용하며, 구성원 평균 연결도에 운영·진행 경험 신호를 더한다.
 */
export function recommendMeetupHost(
  group: MaskedMember[],
  scores: MatchScore[],
): HostRecommendation | null {
  const ranked = group
    .map((member) => {
      const averageScore = averageConnectionScore(member.id, group, scores);
      const isPublicSupport = member.expert_subtype === "공공중간지원";
      const hasLeadershipRole = LEADERSHIP_ROLE_PATTERN.test(member.org.role);
      const facilitationActivities = member.visibility.public.activities.filter(
        (activity) =>
          FACILITATION_ACTIVITIES.some((signal) => activity.includes(signal)),
      );
      const trustSignal = Math.min(member.trust_connections.length, 2);
      const score = Math.min(
        100,
        Math.round(
          averageScore +
            (isPublicSupport ? 12 : 0) +
            (hasLeadershipRole ? 8 : 0) +
            Math.min(facilitationActivities.length * 2, 6) +
            trustSignal,
        ),
      );
      const signals = [
        isPublicSupport ? "공공·중간지원 경험" : null,
        hasLeadershipRole ? `${member.org.role} 운영 경험` : null,
        facilitationActivities[0] ? `${facilitationActivities[0]} 활동` : null,
      ].filter((signal): signal is string => Boolean(signal));

      return {
        member,
        averageScore,
        score,
        signals,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.averageScore - a.averageScore ||
        a.member.id.localeCompare(b.member.id),
    );

  const selected = ranked[0];
  if (!selected) return null;

  const signalText =
    selected.signals.length > 0
      ? `, ${selected.signals.slice(0, 2).join("과 ")}`
      : "";

  return {
    host: selected.member,
    score: selected.score,
    reason: `구성원 평균 연결도 ${selected.averageScore}점${signalText}을 바탕으로 첫 대화를 이끌 호스트로 추천했어요.`,
  };
}

/**
 * 현재 회원·매칭점수 JSON만으로 설명 가능한 임시 AI 모둠을 만든다.
 * 최고 점수 쌍을 시작으로 두 사람과의 평균 점수가 가장 높은 세 번째 회원을 붙인다.
 */
export function buildAiSuggestedMeetups(
  members: MaskedMember[],
  fields: Field[],
  scores: MatchScore[],
): Meetup[] {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const selectedPairs: PairScore[] = [];

  for (const pair of uniquePairs(scores)) {
    if (
      selectedPairs.every(
        (selected) =>
          !selected.memberIds.some((id) => pair.memberIds.includes(id)),
      )
    ) {
      selectedPairs.push(pair);
    }
    if (selectedPairs.length === 2) break;
  }

  return selectedPairs.flatMap((pair, index) => {
    const pairMembers = pair.memberIds
      .map((id) => membersById.get(id))
      .filter((member): member is MaskedMember => Boolean(member));
    if (pairMembers.length !== 2) return [];

    const third = members
      .filter((member) => !pair.memberIds.includes(member.id))
      .map((member) => ({
        member,
        score:
          (scoreBetween(scores, pair.memberIds[0], member.id) +
            scoreBetween(scores, pair.memberIds[1], member.id)) /
          2,
      }))
      .sort((a, b) => b.score - a.score)[0]?.member;

    const group = third ? [...pairMembers, third] : pairMembers;
    const fieldIds = [...new Set(group.flatMap((member) => member.field_tags))];
    const fieldNames = fields
      .filter((field) => fieldIds.includes(field.id))
      .map((field) => field.name);
    const keyword = pair.keywords[0] ?? fieldNames[0] ?? "협업";
    const publicSupportMember = group.find(
      (member) => member.expert_subtype === "공공중간지원",
    );
    const hostRecommendation = recommendMeetupHost(group, scores);
    if (!hostRecommendation) return [];
    const { host } = hostRecommendation;

    return [
      {
        id: `AI-MU-${index + 1}`,
        type: publicSupportMember ? "공공모둠" : "학습모임",
        title: `${keyword} 연결 모둠`,
        purpose: `${group.map((member) => member.name).join("·")}님의 경험을 연결해 작은 협업 가능성을 확인하는 Coffee Chat 모둠입니다.`,
        field_tags: fieldIds,
        region: host.region,
        member_ids: group.map((member) => member.id),
        host_member_id: host.id,
        created_source: "AI추천",
        recommendation_reason: `회원 간 매칭 점수 ${pair.score}점과 ${pair.keywords.slice(0, 3).join("·") || fieldNames.slice(0, 2).join("·")} 접점을 기준으로 구성했어요.`,
        host_recommendation_reason: hostRecommendation.reason,
        host_recommendation_score: hostRecommendation.score,
      } satisfies Meetup,
    ];
  });
}
