// Member — 접근제어의 중심. 공개/비공개층 분리는 전 화면 공통 축.
// 근거: ARCHITECTURE.md §4.2, PRD §10, FR-GL-02/03, NFR-07
//
// [마스킹 구조 강제 설계]
// 이 타입은 논리적 도메인 모델(Member)이며, 시드는 두 파일로 물리 분리된다:
//   · src/data/members.json          → MemberPublicSeed[]  (비민감: RSC/Client 직접 참조 가능)
//   · src/data/private/members-private.json → MemberPrivateSeed[] (민감: DAL만 import)
// DAL이 member_id로 두 파일을 결합해 아래 Member(또는 MaskedMember)로 재조립한다.
// visibility.private(수요태그·핫리드·이력)가 공개 시드 JSON에 애초에 실리지 않으므로,
// RSC 페이로드/초기 HTML로 비공개층이 직렬화 유출되는 경로가 구조적으로 차단된다(ADR-03).

export type MemberType = "기업가" | "전문가";
export type ExpertSubtype =
  | "전문서비스"
  | "컨설턴트"
  | "투자금융"
  | "공공중간지원"
  | null;

/** 공개층 (FR-GL-02: 전체 회원 열람) */
export interface MemberPublicLayer {
  supply_tags: { tagId: number; detail: string }[];
  activities: string[];
  preferred_mode: string;
  region: { sido: string; sigungu: string };
}

/** 비공개층 (FR-GL-03/NFR-07: 본인·운영자·엔진만) */
export interface MemberPrivateLayer {
  /** BR-01/BR-02: detail_quote 는 온보딩 원문 그대로 (요약·윤색 금지) */
  demand_tags: { tagId: number; priority: boolean; detail_quote: string }[];
  hot_lead: {
    flag: boolean;
    project_summary: string;
    needed_partner: string;
    stage: string;
  } | null;
  availability: string;
  /** RecId[] */
  recommendation_history: string[];
}

/** 논리적 완전체(DAL 재조립 결과 / 도메인 계약). 시드 JSON은 아래 분리 타입을 사용. */
export interface Member {
  id: string;
  name: string;
  member_type: MemberType;
  /** FR-RC-08/BR-04 분기 필드 */
  expert_subtype: ExpertSubtype;
  org: { name: string; type: string; role: string };
  region: { sido: string; sigungu: string };
  /** FieldId[] — FR-EM-01 필터 축 */
  field_tags: number[];
  value_chain_stage: string;
  mission_statement: string;
  trust_connections: {
    type: "소개자" | "아는회원" | "소속모임";
    ref: string;
  }[];
  /** 요약 플래그(공개 판단용 아님) */
  hot_lead: boolean;
  visibility: {
    public: MemberPublicLayer;
    private: MemberPrivateLayer;
  };
}

/** src/data/members.json 레코드 — 공개 시드(비공개층 제외). */
export type MemberPublicSeed = Omit<Member, "visibility"> & {
  visibility: { public: MemberPublicLayer };
};

/** src/data/private/members-private.json 레코드 — 비공개층만, member_id로 결합. */
export interface MemberPrivateSeed extends MemberPrivateLayer {
  member_id: string;
}

/** 마스킹된 DTO: private 가 통째로 제거되거나 null (NFR-07, §5.1) */
export type MaskedMember = Omit<Member, "visibility"> & {
  visibility: {
    public: MemberPublicLayer;
    private: MemberPrivateLayer | null;
  };
};
