// DAL: 회원 read — 공개 시드(members.json) + 민감 시드(private/members-private.json)를
// member_id로 재조립한 뒤 visibilityMask를 통과시켜 반환한다.
// 근거: ARCHITECTURE.md §4.3(시드 실채움)·§5.2(DAL 계약)·§7 ADR-03, FR-DA-01/02, FR-GL-02/03
// 이 파일이 members-private.json을 import하는 유일한 지점이어야 한다(ADR-03, T-005 린트 차단).

import membersPublicSeed from "@/data/members.json";
// P1-1(legacy 포함 0건 기준): 클라이언트 번들에는 원문이 공백화된 redacted twin만 싣는다.
// 원본(원문 포함) members-private.json은 서버/스크립트 전용 경로로만 사용한다.
import membersPrivateSeed from "@/data/people/derived/members-private.redacted.json";
import { visibilityMask } from "@/lib/access/visibility-mask";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  ExpertSubtype,
  MaskedMember,
  Member,
  MemberPublicSeed,
  ViewerContext,
} from "@/types";

const publicSeed = membersPublicSeed as MemberPublicSeed[];
const privateSeed = membersPrivateSeed as { member_id: string }[];

const privateByMemberId = new Map<string, { member_id: string }>(
  privateSeed.map((entry) => [entry.member_id, entry]),
);

/** 공개+비공개 시드를 member_id로 결합해 논리적 Member로 재조립한다. */
function reassemble(pub: MemberPublicSeed): Member {
  const priv = privateByMemberId.get(pub.id);
  if (!priv) {
    // 8인 전원이 양쪽 시드에 커버돼야 한다(T-002 Self-check).
    throw new Error(
      `members-private.json에 member_id="${pub.id}"의 비공개층이 없습니다.`,
    );
  }
  return {
    ...pub,
    visibility: {
      public: pub.visibility.public,
      // 클라이언트 시드에는 private 파생값이 없다. 보호 저장소/server DAL이 도입되기
      // 전까지 본인/운영자 화면도 빈 중립 레이어로 fail-closed 한다.
      private: {
        demand_tags: [],
        hot_lead: null,
        availability: "",
        recommendation_history: [],
      },
    },
  };
}

/**
 * C2(재리뷰 REJECT #5): 온보딩 확정 스냅샷을 시드 위에 겹친다.
 * 온보딩 스텝1~4에서 사용자가 고친 조직·지역·분야·미션·공개층 값이 회원 조회에도 즉시
 * 반영되게 한다 — 지금까지는 스냅샷이 store에만 남고 프로필/추천은 옛 시드로 돌았다.
 * 세션 한정(NFR-02·A6)이라 새로고침하면 시드 원본으로 리셋된다.
 */
function applySessionOverlay(member: Member): Member {
  const snapshot =
    useSessionInteractionStore.getState().onboardingResults[member.id]
      ?.snapshot;
  if (!snapshot) return member;
  // 공개 노출 동의(A: consents.publish_profile)가 없으면 공개층 overlay를 적용하지 않고
  // 시드 값을 유지한다 — 미동의 사용자의 세션 수정본이 공개 화면으로 새지 않게 하는 fail-closed.
  // (프로필 자체를 목록에서 빼는 노출 제외 처리는 C4 범위이며 여기서 다루지 않는다.)
  if (!snapshot.consents.publish_profile) return member;
  return {
    ...member,
    org: { ...snapshot.organization },
    region: { ...snapshot.region },
    field_tags: [...snapshot.field_tags],
    value_chain_stage: snapshot.value_chain_stage,
    mission_statement: snapshot.mission_statement,
    visibility: {
      ...member.visibility,
      public: {
        ...member.visibility.public,
        supply_tags: snapshot.supply_tags.map((t) => ({ ...t })),
        activities: [...snapshot.activities],
        preferred_mode: snapshot.preferred_mode,
        // 공개층 region은 최상위 region의 미러다 — 함께 갱신하지 않으면 두 값이 어긋난다.
        region: { ...snapshot.region },
      },
    },
  };
}

/** 재조립 + 세션 overlay — 모든 read 함수가 반드시 이 경로를 거친다. */
function resolveMember(pub: MemberPublicSeed): Member {
  return applySessionOverlay(reassemble(pub));
}

/** 전 회원 목록(마스킹 적용). FR-EM-01 필터·FR-GL-02 전체 열람의 기반. */
export async function getMembers(vc: ViewerContext): Promise<MaskedMember[]> {
  return publicSeed.map((pub) => visibilityMask(resolveMember(pub), vc));
}

/** 단건 회원(마스킹 적용). 없으면 reject. */
export async function getMember(
  vc: ViewerContext,
  id: string,
): Promise<MaskedMember> {
  const pub = publicSeed.find((m) => m.id === id);
  if (!pub) {
    throw new Error(`Member not found: ${id}`);
  }
  return visibilityMask(resolveMember(pub), vc);
}

/**
 * expert_subtype 단건 조회(마스킹 불필요 — 공개 시드 최상위 필드).
 * recommendations.ts(T-003)의 공공중간지원 분기(FR-RC-08)가 사용한다.
 */
export function getExpertSubtype(memberId: string): ExpertSubtype | undefined {
  return publicSeed.find((m) => m.id === memberId)?.expert_subtype;
}

/**
 * 회원 키워드 검색(v1.1 FR-SR-01/02). 이름·조직명·분야(field_tags)·공급 태그(공개층
 * supply_tags.detail)로 필터링한다. 반환은 다른 read 함수와 동일하게 visibilityMask를
 * 통과해 비공개층(수요·핫리드)이 걸러진다(BR-01, FR-GL-03).
 * C2: 검색 haystack·분야 필터도 세션 overlay가 적용된 값을 기준으로 판정한다 —
 * 온보딩에서 바꾼 조직명으로 검색했는데 안 잡히는 불일치를 없앤다.
 */
export async function searchMembers(
  vc: ViewerContext,
  query: string,
  fieldId?: number,
): Promise<MaskedMember[]> {
  const q = query.trim().toLowerCase();
  const matches = publicSeed.map(resolveMember).filter((member) => {
    if (fieldId !== undefined && !member.field_tags.includes(fieldId)) {
      return false;
    }
    if (q.length === 0) return true;
    const supplyText = member.visibility.public.supply_tags
      .map((t) => t.detail)
      .join(" ");
    const haystack =
      `${member.name} ${member.org.name} ${member.keyword_set.join(" ")} ${supplyText}`.toLowerCase();
    return haystack.includes(q);
  });
  return matches.map((member) => visibilityMask(member, vc));
}
