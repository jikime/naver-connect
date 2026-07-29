// DAL: 협업사례 + 프로젝트 제안·트래킹 + 협업관계 그래프 read/write (v1.3).
// 근거: ARCHITECTURE.md §5.2/§5.3, FR-CS-01/02, FR-PP-01/02, FR-GR-09/10
// 쓰기(inputCollabCase·trackProposal)는 로그인 사용자의 비공개 서버 상태에 저장한다.
// v1.2 추가: CollabRelation 그래프, 하위그룹 코드 매핑, simulateCollab 강화.
// v1.3 추가: Supabase async DB 함수 (getCollabCasesFromDB 등) — Server Component 전용.

import type { DatasetLoader } from "@/lib/dal/datasets";
import { getDataset } from "@/lib/dal/datasets";
import {
  hydrateRuntimeState,
  setRuntimeStateValue,
} from "@/lib/dal/runtime-state";
import { useBusinessRelationSessionStore } from "@/stores/business-relation-session";
import type {
  CollabCase,
  CollabRelation,
  Organization,
  ProjectProposal,
  SubgroupCode,
  SubgroupMapEntry,
  ViewerContext,
} from "@/types";

// ──────────────────────────────────────────────
// 하위그룹 시각화 상수 (단일 소스 — 그래프·패턴패널·사례뷰가 공유)
// ──────────────────────────────────────────────

type SubgroupKindOrLetter =
  | "non-social"
  | "supporter"
  | "activist"
  | "A"
  | "B"
  | "C";

/** 층(kind)별 표시 색상. CollabRelationMap·CollabPatternPanel·CollabCasesView가 공유한다. */
export const SUBGROUP_KIND_COLOR: Record<SubgroupKindOrLetter, string> = {
  "non-social": "#6b7686",
  supporter: "#e0983c",
  activist: "#1f7a94",
  C: "#6b7686",
  B: "#e0983c",
  A: "#1f7a94",
};

/** 층(kind)별 한글 라벨. */
export const SUBGROUP_KIND_LABEL: Record<SubgroupKindOrLetter, string> = {
  "non-social": "일반기업",
  supporter: "사회혁신지원가",
  activist: "사회혁신활동가",
  C: "일반기업",
  B: "사회혁신지원가",
  A: "사회혁신활동가",
};

// ──────────────────────────────────────────────
// 하위그룹 코드 유틸
// ──────────────────────────────────────────────

/**
 * 조직 ID → 14개 하위그룹 코드.
 * subgroup_map.json에 없는 조직은 undefined 반환(N-8 회피).
 */
export function getSubgroupCode(
  orgId: string,
  subgroupMap: readonly SubgroupMapEntry[],
): SubgroupCode | undefined {
  return subgroupMap.find((e) => e.org_id === orgId)?.subgroup_code;
}

/**
 * 하위그룹 코드 → 층(kind).
 * C1-C4 = non-social, B1-B4 = supporter, A1-A6 = activist.
 */
export function getSubgroupKind(
  code: SubgroupCode,
): "non-social" | "supporter" | "activist" {
  if (code.startsWith("C")) return "non-social";
  if (code.startsWith("B")) return "supporter";
  return "activist";
}

/** 하위그룹 코드 → 층 레터("A"/"B"/"C"). SUBGROUP_KIND_COLOR/LABEL 인덱싱용 타입-세이프 헬퍼. */
export function getSubgroupLayerLetter(code: SubgroupCode): "A" | "B" | "C" {
  return code[0] as "A" | "B" | "C";
}

/**
 * 조직에 하위그룹 코드를 조인해 반환.
 * 원본 organizations 배열을 변경하지 않고 새 객체를 반환한다.
 */
export function withSubgroupCode(
  org: Organization,
  subgroupMap: readonly SubgroupMapEntry[],
): Organization {
  const code = getSubgroupCode(org.id, subgroupMap);
  if (!code || org.subgroup_code === code) return org;
  return { ...org, subgroup_code: code };
}

// ──────────────────────────────────────────────
// 협업 사례 (CollabCase)
// ──────────────────────────────────────────────

/** 협업 사례 조회(FR-CS-01, FR-GR-09). 세션 중 입력분(inputCollabCase)을 덧붙인다. */
export async function getCollabCases(
  _vc: ViewerContext,
  filter?: { fieldId?: number; orgId?: string },
): Promise<CollabCase[]> {
  await hydrateRuntimeState();
  const collabCasesBase = await getDataset<CollabCase[]>("collab-cases");
  const all = [
    ...collabCasesBase,
    ...useBusinessRelationSessionStore.getState().addedCollabCases,
  ];
  return all.filter((c) => {
    if (filter?.fieldId && !c.field_tags.includes(filter.fieldId)) {
      return false;
    }
    if (filter?.orgId && !c.participant_org_ids.includes(filter.orgId)) {
      return false;
    }
    return true;
  });
}

/** 협업 사례 입력(FR-CS-01). 로그인 사용자의 비공개 서버 상태에 저장한다. */
export async function inputCollabCase(
  vc: ViewerContext,
  input: Omit<CollabCase, "id" | "input_by">,
): Promise<CollabCase> {
  const state = await hydrateRuntimeState();
  const newCase: CollabCase = {
    id: `CC-USER-${Date.now()}`,
    input_by: vc.role === "운영자" ? "운영자" : "회원",
    ...input,
  };
  await setRuntimeStateValue("addedCollabCases", [
    ...state.addedCollabCases,
    newCase,
  ]);
  return newCase;
}

// ──────────────────────────────────────────────
// 협업 관계 그래프 (CollabRelation)
// ──────────────────────────────────────────────

/**
 * 협업 관계 목록 조회(v1.2).
 * filter.onlyActual=true 이면 실제 협력만, false/미지정 이면 잠재 포함.
 * filter.orgId 지정 시 해당 조직이 a 또는 b에 포함된 관계만 반환.
 * filter.domainTag 지정 시 domain_tags에 포함된 관계만 반환.
 */
export async function getCollabRelations(
  _vc: ViewerContext,
  filter?: {
    onlyActual?: boolean;
    orgId?: string;
    domainTag?: number;
    minStrength?: number;
  },
): Promise<CollabRelation[]> {
  const collabRelationsBase =
    await getDataset<CollabRelation[]>("collab-relations");
  return collabRelationsBase.filter((r) => {
    if (filter?.onlyActual && !r.is_actual) return false;
    if (
      filter?.orgId &&
      r.org_a_id !== filter.orgId &&
      r.org_b_id !== filter.orgId
    ) {
      return false;
    }
    if (
      filter?.domainTag !== undefined &&
      !r.domain_tags.includes(filter.domainTag)
    ) {
      return false;
    }
    if (filter?.minStrength !== undefined && r.strength < filter.minStrength) {
      return false;
    }
    return true;
  });
}

/**
 * 하위그룹 쌍 패턴 빈도 분석(v1.2, 정규화 수정).
 * 실제 협력 관계 기준으로 하위그룹 쌍별 건수·평균 강도를 집계한다.
 * org_a/org_b 순서는 데이터 입력 순서에 따라 달라질 수 있으므로("A5×A4" vs "A4×A5"),
 * 두 코드를 사전순으로 정렬한 키로 그룹화해 같은 쌍을 중복 집계하지 않는다.
 */
export async function getCollabPatterns(
  _vc: ViewerContext,
  onlyActual = true,
): Promise<
  {
    pair_code: string;
    count: number;
    avg_strength: number;
    org_a_subgroup: SubgroupCode;
    org_b_subgroup: SubgroupCode;
    relation_types: string[];
  }[]
> {
  const collabRelationsBase =
    await getDataset<CollabRelation[]>("collab-relations");
  const relations = onlyActual
    ? collabRelationsBase.filter((r) => r.is_actual)
    : collabRelationsBase;

  const map = new Map<
    string,
    {
      count: number;
      strength_sum: number;
      codeLow: SubgroupCode;
      codeHigh: SubgroupCode;
      relation_types: Set<string>;
    }
  >();

  for (const r of relations) {
    const [codeLow, codeHigh] = [r.org_a_subgroup, r.org_b_subgroup].sort() as [
      SubgroupCode,
      SubgroupCode,
    ];
    const key = `${codeLow} × ${codeHigh}`;
    const entry = map.get(key);
    if (entry) {
      entry.count += 1;
      entry.strength_sum += r.strength;
      entry.relation_types.add(r.relation_type);
    } else {
      map.set(key, {
        count: 1,
        strength_sum: r.strength,
        codeLow,
        codeHigh,
        relation_types: new Set([r.relation_type]),
      });
    }
  }

  return Array.from(map.entries())
    .map(([pair_code, v]) => ({
      pair_code,
      count: v.count,
      avg_strength: Math.round((v.strength_sum / v.count) * 100) / 100,
      org_a_subgroup: v.codeLow,
      org_b_subgroup: v.codeHigh,
      relation_types: Array.from(v.relation_types),
    }))
    .sort((a, b) => b.count - a.count || b.avg_strength - a.avg_strength);
}

// ──────────────────────────────────────────────
// 협업 시뮬레이션 (강화됨 v1.2)
// ──────────────────────────────────────────────

/**
 * 하위그룹 쌍 간 협업 적합성 점수(0..1).
 * 같은 층 간(A×A, B×B, C×C)보다 층 간 협업(B×A, C×A 등)을 우대.
 * 주의: 이 점수는 하위그룹 "유형" 조합에만 의존하는 일반 점수다.
 * 특정 두 조직이 실제로 협력한 적이 있는지는 simulateCollab의
 * existingRelation(정확한 조직 쌍 매칭)에서 별도로 가산한다 — 유형 레벨
 * 보너스를 여기서 섞으면 실제로는 무관한 조직이 "같은 유형 쌍 어딘가에
 * 실적이 있다"는 이유로 부당하게 높은 점수를 받는 문제가 있었다(v1.2 수정).
 */
function subgroupAffinityScore(
  codeA: SubgroupCode,
  codeB: SubgroupCode,
): number {
  const kindA = getSubgroupKind(codeA);
  const kindB = getSubgroupKind(codeB);

  // 동일 조직은 점수 없음
  if (codeA === codeB) return 0.3;

  // 층 간 조합별 기본 점수
  const crossLayerBonus: Record<string, number> = {
    "supporter-activist": 0.85,
    "activist-supporter": 0.85,
    "non-social-activist": 0.75,
    "activist-non-social": 0.75,
    "non-social-supporter": 0.65,
    "supporter-non-social": 0.65,
    "activist-activist": 0.7,
    "supporter-supporter": 0.55,
    "non-social-non-social": 0.4,
  };

  const key = `${kindA}-${kindB}`;
  return crossLayerBonus[key] ?? 0.5;
}

/** 기준 조직과 실제로 협력한 적이 있는 후보에게 부여하는 명시적 가산점(0..100 스케일). */
const EXISTING_RELATION_BONUS = 15;

/**
 * 협업 시뮬레이션(FR-CS-02 강화 v1.2, 스코어링 재조정).
 * 기준 조직 대비 후보를 평가할 때 공유 분야 수 + 하위그룹 친화성 + buying_power를
 * 복합 점수로 산출하고, 그 조직과 "실제로" 협력한 적이 있으면 명시적 가산점을 더한다.
 * (v1.2 수정: 이전에는 유형 레벨 보너스가 뭉개져 실제 파트너보다 무관한
 * 고구매력 조직이 상위에 노출되는 문제가 있었다.)
 */
export async function simulateCollab(
  _vc: ViewerContext,
  orgId: string,
): Promise<{
  baseOrg: Organization;
  candidates: {
    org: Organization;
    sharedFieldIds: number[];
    subgroupAffinityScore: number;
    compositeScore: number;
    rationale: string;
    existingRelation: CollabRelation | null;
  }[];
  similarCases: CollabCase[];
  baseSubgroupCode: SubgroupCode | undefined;
}> {
  await hydrateRuntimeState();
  const [organizations, subgroupMap, collabCasesBase, collabRelationsBase] =
    await Promise.all([
      getDataset<Organization[]>("organizations"),
      getDataset<SubgroupMapEntry[]>("subgroup-map"),
      getDataset<CollabCase[]>("collab-cases"),
      getDataset<CollabRelation[]>("collab-relations"),
    ]);
  const baseOrg = organizations.find((o) => o.id === orgId);
  if (!baseOrg) {
    throw new Error(`Organization not found: ${orgId}`);
  }

  const baseSubgroupCode = getSubgroupCode(orgId, subgroupMap);

  const allCases = [
    ...collabCasesBase,
    ...useBusinessRelationSessionStore.getState().addedCollabCases,
  ];

  // 기준 조직이 참여한 실제 협업 관계 목록
  const existingRelationMap = new Map<string, CollabRelation>();
  for (const r of collabRelationsBase) {
    if (r.is_actual) {
      if (r.org_a_id === orgId) existingRelationMap.set(r.org_b_id, r);
      else if (r.org_b_id === orgId) existingRelationMap.set(r.org_a_id, r);
    }
  }

  const candidates = organizations
    .filter((o) => o.id !== orgId)
    .map((org) => {
      const sharedFieldIds = org.field_tags.filter((tag) =>
        baseOrg.field_tags.includes(tag),
      );

      const candidateSubgroupCode = getSubgroupCode(org.id, subgroupMap);
      const affinity =
        baseSubgroupCode && candidateSubgroupCode
          ? subgroupAffinityScore(baseSubgroupCode, candidateSubgroupCode)
          : 0.5;

      const existingRelation = existingRelationMap.get(org.id) ?? null;

      // 복합 점수: 공유분야(35%) + 하위그룹친화성(35%) + buying_power(15%)
      // + 실제 협력 조직 명시적 가산점(existingRelation, 위 3항목과 별도로 최대 15점).
      const sharedFieldScore = Math.min(1.0, sharedFieldIds.length / 3);
      const bpScore = org.buying_power / 100;
      const baseScore = Math.round(
        (sharedFieldScore * 0.35 + affinity * 0.35 + bpScore * 0.15) * 100,
      );
      const compositeScore = Math.min(
        100,
        baseScore + (existingRelation ? EXISTING_RELATION_BONUS : 0),
      );

      const subgroupPart =
        baseSubgroupCode && candidateSubgroupCode
          ? ` · ${baseSubgroupCode}×${candidateSubgroupCode} 친화도 ${Math.round(affinity * 100)}점`
          : "";
      const existingPart = existingRelation
        ? ` · 기존 협력(${existingRelation.relation_type}, +${EXISTING_RELATION_BONUS}점)`
        : "";
      const rationale = `공유 분야 ${sharedFieldIds.length}개 · 종합 ${compositeScore}점${subgroupPart}${existingPart}`;

      return {
        org,
        sharedFieldIds,
        subgroupAffinityScore: Math.round(affinity * 100) / 100,
        compositeScore,
        rationale,
        existingRelation,
      };
    })
    // 실제 협력 조직은 점수와 무관하게 항상 후보에 포함(투명성) — 공유분야가
    // 없더라도 과거 실적이 있다면 시뮬레이션 결과에서 숨기지 않는다.
    .filter(
      (c) =>
        c.sharedFieldIds.length > 0 ||
        c.compositeScore >= 50 ||
        c.existingRelation,
    )
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 8);

  const similarCases = allCases.filter(
    (c) =>
      c.participant_org_ids.includes(orgId) ||
      c.field_tags.some((tag) => baseOrg.field_tags.includes(tag)),
  );

  return { baseOrg, candidates, similarCases, baseSubgroupCode };
}

// ──────────────────────────────────────────────
// 프로젝트 제안 (ProjectProposal)
// ──────────────────────────────────────────────

/** 프로젝트 제안 조회(FR-PP-01, FR-GR-10). 세션 중 상태 변경분(trackProposal)을 반영한다. */
export async function getProposals(
  _vc: ViewerContext,
  loadDataset: DatasetLoader = getDataset,
): Promise<ProjectProposal[]> {
  if (loadDataset === getDataset) await hydrateRuntimeState();
  const proposalsBase =
    await loadDataset<ProjectProposal[]>("project-proposals");
  const overrides =
    useBusinessRelationSessionStore.getState().proposalStatusOverrides;
  return proposalsBase.map((p) =>
    overrides[p.id] ? { ...p, track_status: overrides[p.id] } : p,
  );
}

/** 제안 상태 전이(FR-PP-02): 제안됨→검토→성사/중단. 서버에 영속 저장한다. */
export async function trackProposal(
  _vc: ViewerContext,
  id: string,
  status: ProjectProposal["track_status"],
): Promise<ProjectProposal> {
  const state = await hydrateRuntimeState();
  const proposalsBase =
    await getDataset<ProjectProposal[]>("project-proposals");
  const base = proposalsBase.find((p) => p.id === id);
  if (!base) {
    throw new Error(`Proposal not found: ${id}`);
  }
  await setRuntimeStateValue("proposalStatusOverrides", {
    ...state.proposalStatusOverrides,
    [id]: status,
  });
  return { ...base, track_status: status };
}

// DB 기반 async 함수는 src/lib/dal/collaboration-server.ts에 분리.
// Server Component에서는 그 파일을 직접 import하세요.
