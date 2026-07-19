// 금융기관/상품 (v1.1 신규 시드) [창작 목업]
// 근거: ARCHITECTURE.md §4.2, FR-FN-01~03
// 시드: src/data/financial_products.json (비민감)

export interface FinancialProduct {
  id: string;
  institution: string;
  product_name: string;
  type: "정책융자" | "임팩트투자" | "신협" | "보증" | "기금";
  field_tags: number[];
  stage_hint: string;
  region: string;
  conditions: string;
  /** FR-FN-02 연락 CTA */
  contact: string;
  /** FR-FN-03: 미완이면 뱃지만, 확정/계약 차단(OQ-02 신협) */
  legal_review_status: "완료" | "검토중" | "미착수";
}
