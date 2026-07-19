// DAL: 자원검색(FR-RS) + 금융 서비스(FR-FN) — v1.1 신규 3단계 기능.
// 근거: ARCHITECTURE.md §5.2, FR-RS-01/02, FR-FN-01~03
// opportunities.json·financial_products.json은 비민감 시드(직접 import 가능, ADR-03 밖).
// 검색/필터는 순수 read이며 쓰기가 없다 — 정적 스텁 v1.0 경계와 무관하게 세션 상태도 불필요.

import fieldsSeed from "@/data/fields.json";
import financialProductsSeed from "@/data/financial_products.json";
import opportunitiesSeed from "@/data/opportunities.json";
import { resolveDealFieldNames } from "@/lib/dal/deal";
import type { FinancialProduct, Opportunity, ViewerContext } from "@/types";

const opportunities = opportunitiesSeed as Opportunity[];
const financialProducts = financialProductsSeed as FinancialProduct[];

type FieldSeed = { id: number; name: string };
const fields = fieldsSeed as FieldSeed[];

/** FR-RS-01 자원검색 필터. */
export interface OpportunityFilter {
  field?: string;
  region?: string;
  consortiumRequired?: boolean;
  keyword?: string;
}

/** 정책사업 검색(FR-RS-01). opportunities.json을 분야·지역·컨소시엄 요건·키워드로 필터링. */
export async function searchOpportunities(
  _vc: ViewerContext,
  filter: OpportunityFilter = {},
): Promise<Opportunity[]> {
  return opportunities.filter((opp) => {
    if (filter.field && opp.field !== filter.field) {
      return false;
    }
    if (
      filter.region &&
      opp.region !== filter.region &&
      opp.region !== "전국"
    ) {
      return false;
    }
    if (
      filter.consortiumRequired !== undefined &&
      opp.consortium_required !== filter.consortiumRequired
    ) {
      return false;
    }
    if (filter.keyword) {
      const keyword = filter.keyword.trim().toLowerCase();
      const haystack =
        `${opp.source} ${opp.field} ${opp.region} ${opp.target_requirement}`.toLowerCase();
      if (keyword && !haystack.includes(keyword)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * FR-RS-02 "이 공고, 이 팀이면 가능합니다" 매칭. 등록된 딜의 참여 조직 분야(resolveDealFieldNames)와
 * 공고 분야명이 겹치면 매칭으로 본다 — 시드 매칭(목업), 실제 적합성 심사가 아니다.
 */
export async function matchOpportunitiesForDeal(
  vc: ViewerContext,
  dealId: string,
): Promise<Opportunity[]> {
  const dealFieldNames = new Set(resolveDealFieldNames(dealId));
  if (dealFieldNames.size === 0) {
    return [];
  }
  const all = await searchOpportunities(vc);
  return all.filter((opp) => dealFieldNames.has(opp.field));
}

/** FR-FN-01/02 금융 서비스 필터. */
export interface FinancialProductFilter {
  fieldId?: number;
  type?: FinancialProduct["type"];
  region?: string;
  keyword?: string;
}

/**
 * 금융기관/상품 제안·검색(FR-FN-01/02). 분야·유형·지역·키워드로 필터링한다. FR-FN-03의
 * 법률검토 상태(legal_review_status)는 필터링하지 않고 그대로 반환 — 화면에서 "완료"가
 * 아니면 뱃지만 표시하고 확정/계약 기능은 제공하지 않는다(OQ-02 신협 상품 확정 금지).
 */
export async function getFinancialProducts(
  _vc: ViewerContext,
  filter: FinancialProductFilter = {},
): Promise<FinancialProduct[]> {
  return financialProducts.filter((product) => {
    if (filter.fieldId && !product.field_tags.includes(filter.fieldId)) {
      return false;
    }
    if (filter.type && product.type !== filter.type) {
      return false;
    }
    if (
      filter.region &&
      product.region !== filter.region &&
      product.region !== "전국"
    ) {
      return false;
    }
    if (filter.keyword) {
      const keyword = filter.keyword.trim().toLowerCase();
      const haystack =
        `${product.institution} ${product.product_name} ${product.conditions}`.toLowerCase();
      if (keyword && !haystack.includes(keyword)) {
        return false;
      }
    }
    return true;
  });
}

/** 분야 id → 분야명 조회(필터 UI 라벨용). */
export function getFieldName(fieldId: number): string | undefined {
  return fields.find((f) => f.id === fieldId)?.name;
}
