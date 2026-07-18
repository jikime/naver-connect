// DAL: 추천 read — 뷰어 주간 리스트/상세 + 공공중간지원 분기(생성 단계 차단) + 최소노출 마스킹.
// 근거: ARCHITECTURE.md §5.2/§5.3, "공공중간지원 분기 계약"·"접근제어 계약",
//       FR-RC-01/02/06/08, BR-01/BR-04, N-5(FR-RC-01↔08 상호참조)
// 시드: src/data/private/recommendations.json (민감 — contact_point가 비공개 수요 원문 인용)

import recommendationsSeed from "@/data/private/recommendations.json";
import { getExpertSubtype } from "@/lib/dal/members";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  MatchType,
  Recommendation,
  RecStatus,
  ViewerContext,
} from "@/types";

const seed = recommendationsSeed as Recommendation[];

/** 이 추천이 뷰어 본인/운영자와 무관해 원문 대신 min_exposure_note만 볼 수 있는지 판정. */
function isRecommendationParty(
  rec: Recommendation,
  vc: ViewerContext,
): boolean {
  return (
    vc.role === "운영자" ||
    vc.personaId === rec.to_member_id ||
    vc.personaId === rec.from_member_id
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
  // FR-RC-06/BR-01: 당사자(수신자·발신자)·운영자가 아니면 원문 접점 대신 최소노출 문구만 노출.
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

/** 뷰어(vc.personaId)에게 "온" 추천인지: 1:1은 to_member_id, 모듬은 참여자 목록. */
function isAddressedTo(rec: Recommendation, personaId: string): boolean {
  if (rec.rec_kind === "모듬") {
    return rec.meetup?.member_ids.includes(personaId) ?? false;
  }
  return rec.to_member_id === personaId;
}

/**
 * 주간 추천 리스트(FR-RC-01/02). 대상(vc.personaId)의 expert_subtype이 '공공중간지원'이면
 * 1:1 추천은 애초에 포함하지 않고 rec_kind='모듬'만 남긴다 — 사후 필터가 아니라
 * getRecommendations 자체가 "생성 단계"를 흉내내는 지점이므로 이 함수 안에서 강제한다(FR-RC-08·N-5).
 */
export async function getRecommendations(
  vc: ViewerContext,
  week?: string,
): Promise<Recommendation[]> {
  const targetSubtype = getExpertSubtype(vc.personaId);
  const addressedToViewer = seed.filter((rec) =>
    isAddressedTo(rec, vc.personaId),
  );
  const weekFiltered = week
    ? addressedToViewer.filter((rec) => rec.sent_week === week)
    : addressedToViewer;
  const branchFiltered =
    targetSubtype === "공공중간지원"
      ? weekFiltered.filter((rec) => rec.rec_kind === "모듬")
      : weekFiltered;
  return branchFiltered.map((rec) => withSessionAndMask(rec, vc));
}

/** 지식 그래프(A-v2)용 구조 엣지. 관계 존재·매칭유형·상태만 담고 원문은 일절 담지 않는다. */
export interface RecommendationGraphEdge {
  id: string;
  from: string;
  to: string;
  match_type: MatchType;
  rec_kind: "1:1" | "모듬";
  status: RecStatus;
}

/**
 * 지식 그래프의 사람↔사람 추천 엣지(구조만). BR-01: message·contact_point·
 * min_exposure_note·matching_rationale·is_hot_lead 등 비공개/민감 필드는 절대 투영하지 않고
 * from/to/match_type/rec_kind/status만 남긴다. recommendations.json을 읽는 유일한 지점이
 * 이 파일이어야 하므로(ADR-03) 그래프 조립 DAL도 시드를 직접 import하지 않고 이 함수를 경유한다.
 * 뷰어별 필터(FR-RC-08 공공중간지원 분기 등)는 "추천 생성" 단계의 규칙이며, 여기서는
 * 네트워크 전경(overview)의 구조 엣지를 반환한다.
 */
export async function getRecommendationGraphEdges(
  _vc: ViewerContext,
): Promise<RecommendationGraphEdge[]> {
  const edges: RecommendationGraphEdge[] = [];
  for (const rec of seed) {
    if (rec.rec_kind === "모듬") {
      const organizer = rec.from_member_id;
      for (const memberId of rec.meetup?.member_ids ?? []) {
        if (memberId === organizer) continue;
        edges.push({
          id: `${rec.id}:${memberId}`,
          from: organizer,
          to: memberId,
          match_type: rec.match_type,
          rec_kind: "모듬",
          status: rec.status,
        });
      }
    } else if (rec.to_member_id) {
      edges.push({
        id: rec.id,
        from: rec.from_member_id,
        to: rec.to_member_id,
        match_type: rec.match_type,
        rec_kind: "1:1",
        status: rec.status,
      });
    }
  }
  return edges;
}

/** 추천 상세(FR-RC-03~07). 없으면 reject. */
export async function getRecommendation(
  vc: ViewerContext,
  id: string,
): Promise<Recommendation> {
  const rec = seed.find((r) => r.id === id);
  if (!rec) {
    throw new Error(`Recommendation not found: ${id}`);
  }
  return withSessionAndMask(rec, vc);
}
