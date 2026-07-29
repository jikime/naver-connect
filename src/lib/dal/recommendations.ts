// DAL: 추천 read — 뷰어 주간 리스트/상세 + 공공중간지원 분기(생성 단계 차단) + 최소노출 마스킹.
// 근거: ARCHITECTURE.md §5.2/§5.3, "공공중간지원 분기 계약"·"접근제어 계약",
//       FR-RC-01/02/06/08, BR-01/BR-04, N-5(FR-RC-01↔08 상호참조)
// 시드: src/data/private/recommendations.json (민감 — contact_point가 비공개 수요 원문 인용)

// P1-1: 클라이언트 경로에는 원문 인용이 소거된 redacted twin만 싣는다(raw quote 번들 0건 기준).
import recommendationsSeed from "@/data/people/derived/recommendations.redacted.json";
// C3: 동의 판정·엔진 산출·허용 pair·그래프 엣지는 전부 서버 번들에서 온다(클라 private 입력 0).
import {
  getMatchingBundle,
  normalizeRecommendationId,
  parseEngineRecId,
} from "@/lib/dal/matching";
import { meetupsById } from "@/lib/dal/meetups";
import { getExpertSubtype } from "@/lib/dal/members";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  MatchScore,
  MatchType,
  Recommendation,
  RecStatus,
  ViewerContext,
} from "@/types";

const seed = recommendationsSeed as Recommendation[];

function scoreKey(fromId: string, toId: string | null): string {
  return `${fromId}→${toId ?? ""}`;
}

/** rec_kind==='모둠'인 레코드의 참여자 목록을 meetup_id로 meetups.json에서 조회한다(ADR-06 v1.1). */
function meetupMemberIds(rec: Recommendation): string[] {
  if (rec.rec_kind !== "모둠" || !rec.meetup_id) return [];
  return meetupsById.get(rec.meetup_id)?.member_ids ?? [];
}

/** 이 추천이 뷰어 본인/운영자와 무관해 원문 대신 min_exposure_note만 볼 수 있는지 판정. */
function isRecommendationParty(
  rec: Recommendation,
  vc: ViewerContext,
): boolean {
  return (
    vc.role === "운영자" ||
    vc.personaId === rec.to_member_id ||
    vc.personaId === rec.from_member_id ||
    (rec.rec_kind === "모둠" && meetupMemberIds(rec).includes(vc.personaId))
  );
}

/** 세션 오버라이드(거절/후기/승인) + 최소노출 마스킹을 반영한 뷰 모델로 합성한다. */
function withSessionAndMask(
  rec: Recommendation,
  vc: ViewerContext,
): Recommendation {
  const override =
    useSessionInteractionStore.getState().recommendationOverrides[rec.id];
  const merged: Recommendation = override ? { ...rec, ...override } : rec;
  const isParty = isRecommendationParty(merged, vc);
  // FR-RC-06/BR-01: 당사자·운영자가 아니면 최소노출 문구만.
  // C3: 클라이언트 시드는 중립 twin이라 원문 자체가 없다 — 원문 열람 복원은 서버 경계에서
  // 동의(C) 검증과 함께 M2에 제공한다.
  return {
    ...merged,
    message: {
      ...merged.message,
      contact_point: isParty
        ? merged.message.contact_point
        : merged.min_exposure_note,
    },
  };
}

/** 뷰어(vc.personaId)에게 "온" 추천인지: 1:1은 to_member_id, 모둠은 meetups.json 참여자 목록. */
function isAddressedTo(rec: Recommendation, personaId: string): boolean {
  if (rec.rec_kind === "모둠") {
    return meetupMemberIds(rec).includes(personaId);
  }
  return rec.to_member_id === personaId;
}

/** match_scores.json 기준 점수(높을수록 우선). 모둠처럼 대응 점수가 없으면 0(최하위) 취급. */
function scoreOf(
  rec: Recommendation,
  scoresByPair: Map<string, MatchScore>,
): number {
  return (
    scoresByPair.get(scoreKey(rec.from_member_id, rec.to_member_id))?.score ?? 0
  );
}

/** 공통점 그룹: match_scores 점수순 정렬(내림차순, FR-RC-01). */
function sortCommonGroup(
  recs: Recommendation[],
  scoresByPair: Map<string, MatchScore>,
): Recommendation[] {
  return [...recs].sort(
    (a, b) => scoreOf(b, scoresByPair) - scoreOf(a, scoresByPair),
  );
}

/**
 * 차이점(상보축) 그룹: 핫리드+퍼즐형을 1순위로 배치하고(FR-RC-02), 그 외는 match_scores
 * 점수순으로 정렬한다(FR-RC-01).
 */
function sortDifferentGroup(
  recs: Recommendation[],
  scoresByPair: Map<string, MatchScore>,
): Recommendation[] {
  return [...recs].sort((a, b) => {
    const aPriority = a.is_hot_lead && a.match_type === "퍼즐형" ? 0 : 1;
    const bPriority = b.is_hot_lead && b.match_type === "퍼즐형" ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return scoreOf(b, scoresByPair) - scoreOf(a, scoresByPair);
  });
}

/**
 * 주간 추천 리스트(v1.1 개편 FR-RC-01/02). 대상(vc.personaId)의 expert_subtype이 '공공중간지원'이면
 * 1:1 추천은 애초에 포함하지 않고 rec_kind='모둠'만 남긴다 — 사후 필터가 아니라
 * getRecommendations 자체가 "생성 단계"를 흉내내는 지점이므로 이 함수 안에서 강제한다(FR-RC-08·N-5).
 * v1.1: 결과를 rec_axis 기준 "공통점"/"차이점" 두 그룹으로 나눠 반환한다(각 최대 15, 화면에서
 * 초기 5+더보기로 노출 — 그룹 캡·정렬만 DAL이 하고 페이지네이션은 화면 책임).
 */
export async function getRecommendations(
  vc: ViewerContext,
  week?: string,
): Promise<{ common: Recommendation[]; different: Recommendation[] }> {
  const targetSubtype = getExpertSubtype(vc.personaId);
  // C3: 서버 번들 1회 호출 — 엔진 추천·허용 pair·점수를 함께 받는다(클라 private 입력 0).
  const bundle = await getMatchingBundle(vc);
  const allowedSeedIds = new Set(bundle.allowedSeedRecIds);
  // C4(#3): declined(사유 5종 전부)는 주간 목록에 재노출하지 않는다 — 원본 declined는
  // 클라 twin에서 status가 중립화돼 있어 서버 판정(hiddenSeedRecIds)만이 정본이다.
  const hiddenSeedIds = new Set(bundle.hiddenSeedRecIds);
  // M1-7: 수동 시드 + 매칭엔진 산출을 병행 노출(중복 pair는 서버에서 제외됨).
  // P1-2: 매칭 동의(B)가 없는 pair의 1:1 시드 추천은 목록에서 제외(fail-closed, 서버 판정).
  const addressedToViewer = [
    ...seed.filter(
      (rec) =>
        (vc.role === "운영자" || isAddressedTo(rec, vc.personaId)) &&
        allowedSeedIds.has(rec.id) &&
        !hiddenSeedIds.has(rec.id),
    ),
    ...bundle.engineRecommendations,
  ];
  const weekFiltered = week
    ? addressedToViewer.filter((rec) => rec.sent_week === week)
    : addressedToViewer;
  const branchFiltered =
    targetSubtype === "공공중간지원"
      ? weekFiltered.filter((rec) => rec.rec_kind === "모둠")
      : weekFiltered;
  const masked = branchFiltered.map((rec) => withSessionAndMask(rec, vc));
  const scoresByPair = new Map(
    bundle.scores.map((s) => [scoreKey(s.from_member_id, s.to_member_id), s]),
  );
  const common = sortCommonGroup(
    masked.filter((rec) => rec.rec_axis === "공통점"),
    scoresByPair,
  ).slice(0, 15);
  const different = sortDifferentGroup(
    masked.filter((rec) => rec.rec_axis === "차이점"),
    scoresByPair,
  ).slice(0, 15);
  return { common, different };
}

/** 지식 그래프(A-v2)용 구조 엣지. 관계 존재·매칭유형·상태만 담고 원문은 일절 담지 않는다. */
export interface RecommendationGraphEdge {
  id: string;
  from: string;
  to: string;
  match_type: MatchType;
  rec_kind: "1:1" | "모둠";
  status: RecStatus;
}

/**
 * 지식 그래프의 사람↔사람 추천 엣지(구조만). BR-01: message·contact_point·
 * min_exposure_note·matching_rationale·is_hot_lead 등 비공개/민감 필드는 절대 투영하지 않고
 * from/to/match_type/rec_kind/status만 남긴다. recommendations.json을 읽는 유일한 지점이
 * 이 파일이어야 하므로(ADR-03) 그래프 조립 DAL도 시드를 직접 import하지 않고 이 함수를 경유한다.
 * 운영자는 전체 구조 엣지를 보고, 일반 회원은 본인이 endpoint이며 양쪽 매칭 동의가
 * 유효한 pair만 본다. 원문 없는 구조라도 타인 관계망을 전역 열거할 수 없게 한다.
 */
export async function getRecommendationGraphEdges(
  vc: ViewerContext,
): Promise<RecommendationGraphEdge[]> {
  // C3·C4: 뷰어 권한·동의·declined·모둠(참여자 전원 동의, demo 한정) gate가 전부
  // 서버(computeGraphEdges)에서 계산된 엣지를 그대로 반환한다.
  const bundle = await getMatchingBundle(vc);
  return bundle.graphEdges;
}

/** 추천 상세(FR-RC-03~07). 없으면 reject. */
export async function getRecommendation(
  vc: ViewerContext,
  id: string,
): Promise<Recommendation> {
  const normalizedId = normalizeRecommendationId(id);
  const engineRef = parseEngineRecId(normalizedId);
  // 엔진 ID의 recipient/other를 바꿔 대입하며 타인 추천 존재 여부를 열거하지 못하게
  // 서버 번들 조회 전에 동일한 당사자/운영자 게이트를 적용한다.
  if (
    engineRef &&
    vc.role !== "운영자" &&
    vc.personaId !== engineRef.recipient &&
    vc.personaId !== engineRef.other
  ) {
    throw new Error(`Recommendation not found: ${normalizedId}`);
  }
  if (engineRef) {
    // 서버 번들은 recipient 관점으로 계산된다 — 운영자/상대가 조회해도 동일 산출.
    const bundle = await getMatchingBundle({
      role: vc.role,
      personaId: engineRef.recipient,
    });
    const rec = bundle.engineRecommendations.find((r) => r.id === normalizedId);
    if (!rec) {
      throw new Error(`Recommendation not found: ${normalizedId}`);
    }
    return withSessionAndMask(rec, vc);
  }
  const bundle = await getMatchingBundle(vc);
  const rec = seed.find((r) => r.id === normalizedId);
  if (
    !rec ||
    !bundle.allowedSeedRecIds.includes(normalizedId) ||
    !isRecommendationParty(rec, vc)
  ) {
    throw new Error(`Recommendation not found: ${normalizedId}`);
  }
  return withSessionAndMask(rec, vc);
}
