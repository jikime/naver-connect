// 3단계 정적 스텁 — DealRoom / ExpertService / GroupBuy
// 근거: ARCHITECTURE.md §4.2, FR-DR-01~04, FR-BO-01~04
// 시드: src/data/private/deal_rooms.json (민감 — 핫리드 씨앗), src/data/expert_services.json (비민감)

export type GateState = { passed: boolean; date: string | null };

/** FR-DR-01~04 */
export interface DealRoom {
  id: string;
  title: string;
  stage: "씨앗" | "탐색" | "기획" | "실행" | "자립";
  /** FR-DR-02, v1.1: "딜소싱" 유입 추가 */
  source_type:
    | "핫리드"
    | "격차기회카드"
    | "모임"
    | "외부공고"
    | "공고역방향"
    | "딜소싱";
  source_ref: string;
  gate_status: { G1: GateState; G2: GateState; G3: GateState; G4: GateState };
  participating_orgs: string[];
  /** "잘 헤어지는 규칙" (정적 표기만) */
  agreement_doc: { note: string };
  // ── v1.1 확장 (FR-DR-05 "내 딜 현황" 관점) ──
  /** 제안·진행 주체 — "내가 제안한 딜" 판별 */
  owner_member_id: string;
  /** 관여 회원 — "내가 진행하는 딜" 판별 */
  participating_member_ids: string[];
}

/** FR-BO-01/02/04 */
export interface ExpertService {
  expert_id: string;
  category: "회계세무" | "노무" | "법무" | "브랜딩" | "IT" | "기획";
  certification: string;
  experience_tags: string[];
  profile_badge: string;
  /** 기장대행·공모정산·취업규칙정비 등 */
  service_catalog: { name: string; price_range: string }[];
  reviews_summary: string;
  recontract_rate: number;
  /** 이해충돌 공시 */
  coi_disclosure: string;
}

/** FR-BO-03 */
export interface GroupBuy {
  id: string;
  service_name: string;
  /** 기장대행 20개 조직 */
  member_org_count: number;
  target_count: number;
  unit_price_cut: string;
  status: string;
}

/** expert_services.json 파일 전체 구조 (getExpertServices 소스) */
export interface ExpertServicesSeed {
  _comment?: string;
  services: ExpertService[];
  groupBuys: GroupBuy[];
}
