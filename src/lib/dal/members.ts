// DAL: 회원 read — 공개 시드(members.json) + 민감 시드(private/members-private.json)를
// member_id로 재조립한 뒤 visibilityMask를 통과시켜 반환한다.
// 근거: ARCHITECTURE.md §4.3(시드 실채움)·§5.2(DAL 계약)·§7 ADR-03, FR-DA-01/02, FR-GL-02/03
// 이 파일이 members-private.json을 import하는 유일한 지점이어야 한다(ADR-03, T-005 린트 차단).

import membersPublicSeed from "@/data/members.json";
import membersPrivateSeed from "@/data/private/members-private.json";
import { visibilityMask } from "@/lib/access/visibility-mask";
import type {
  ExpertSubtype,
  MaskedMember,
  Member,
  MemberPrivateSeed,
  MemberPublicSeed,
  ViewerContext,
} from "@/types";

const publicSeed = membersPublicSeed as MemberPublicSeed[];
const privateSeed = membersPrivateSeed as MemberPrivateSeed[];

const privateByMemberId = new Map<string, MemberPrivateSeed>(
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
  const { member_id: _memberId, ...privateLayer } = priv;
  return {
    ...pub,
    visibility: {
      public: pub.visibility.public,
      private: privateLayer,
    },
  };
}

/** 전 회원 목록(마스킹 적용). FR-EM-01 필터·FR-GL-02 전체 열람의 기반. */
export async function getMembers(vc: ViewerContext): Promise<MaskedMember[]> {
  return publicSeed.map((pub) => visibilityMask(reassemble(pub), vc));
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
  return visibilityMask(reassemble(pub), vc);
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
 */
export async function searchMembers(
  vc: ViewerContext,
  query: string,
  fieldId?: number,
): Promise<MaskedMember[]> {
  const q = query.trim().toLowerCase();
  const matches = publicSeed.filter((pub) => {
    if (fieldId !== undefined && !pub.field_tags.includes(fieldId)) {
      return false;
    }
    if (q.length === 0) return true;
    const supplyText = pub.visibility.public.supply_tags
      .map((t) => t.detail)
      .join(" ");
    const haystack =
      `${pub.name} ${pub.org.name} ${pub.keyword_set.join(" ")} ${supplyText}`.toLowerCase();
    return haystack.includes(q);
  });
  return matches.map((pub) => visibilityMask(reassemble(pub), vc));
}
