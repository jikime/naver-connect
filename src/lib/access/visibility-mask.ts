// visibilityMask — 접근제어 코어. 뷰어가 대상 본인 또는 운영자가 아니면
// visibility.private를 null로 치환해 비공개층이 렌더 전에 걸러지게 한다.
// 근거: ARCHITECTURE.md §5.1(ViewerContext/MaskedMember)·§5.3(접근제어 계약)·
//       §7 ADR-03(마스킹은 DAL 매퍼 단계에서 중앙집중 강제), FR-GL-02/03, NFR-07, ARCH §9 R-03

import type { MaskedMember, Member, ViewerContext } from "@/types";

/**
 * 뷰어가 targetMemberId의 비공개층(visibility.private)을 볼 수 있는지 판정한다.
 * 규칙(§5.3): 대상 본인 또는 운영자만 true.
 */
export function isPrivilegedViewer(
  viewer: ViewerContext,
  targetMemberId: string,
): boolean {
  return viewer.role === "운영자" || viewer.personaId === targetMemberId;
}

/**
 * Member(재조립 완료된 도메인 객체) → MaskedMember.
 * 비본인·비운영자 뷰어는 visibility.private가 null로 치환된다(NFR-07).
 * 마스킹은 이 매퍼 단계에서 끝나므로, 이후 컴포넌트/DOM에는 비공개 필드가 도달하지 않는다.
 */
export function visibilityMask(
  member: Member,
  viewer: ViewerContext,
): MaskedMember {
  const canSeePrivate = isPrivilegedViewer(viewer, member.id);
  return {
    ...member,
    visibility: {
      public: member.visibility.public,
      private: canSeePrivate ? member.visibility.private : null,
    },
  };
}

/**
 * 추천 메시지의 수요 인용 최소화(FR-RC-06·BR-01): 뷰어가 발신 회원 본인/운영자가
 * 아니면 원문 접점(contact_point) 대신 min_exposure_note 범위로 축약된 문자열만 노출한다.
 * DAL의 getRecommendations/getRecommendation(T-003)이 반환 직전 호출한다.
 */
export function minExposureContactPoint(
  contactPoint: string,
  minExposureNote: string,
  viewer: ViewerContext,
  sourceMemberId: string,
): string {
  return isPrivilegedViewer(viewer, sourceMemberId)
    ? contactPoint
    : minExposureNote;
}
