// 격차 리포트 전용 조회 헬퍼 — vc_stages·resources·opportunities는 DAL에 별도
// read 함수가 없는 비민감 공개 시드라 이 화면 범위에서 직접 import한다(ADR-03은
// src/data/private/*만 DAL 경유를 강제하며, 이 파일들은 그 대상이 아니다).
// 근거: TASKS.md T-018/T-019, ARCHITECTURE.md §4.2(VCStage·Resource·Opportunity)

import opportunitiesSeed from "@/data/opportunities.json";
import resourcesSeed from "@/data/resources.json";
import vcStagesSeed from "@/data/vc_stages.json";
import type { Opportunity, Resource, VCStage } from "@/types";

const vcStages = vcStagesSeed as VCStage[];
const resources = resourcesSeed as Resource[];
const opportunities = opportunitiesSeed as Opportunity[];

const vcStageById = new Map(vcStages.map((stage) => [stage.id, stage]));
const resourceById = new Map(resources.map((r) => [r.id, r]));
const opportunityById = new Map(opportunities.map((o) => [o.id, o]));

export function getVcStage(stageId: number): VCStage | undefined {
  return vcStageById.get(stageId);
}

/** "101 진료·퇴원" 형태의 짧은 라벨. STAGE_LINK 근거·노드 상세에서 공용으로 쓴다. */
export function stageLabel(stageId: number): string {
  const stage = vcStageById.get(stageId);
  return stage ? `${stage.name}(#${stage.id})` : `#${stageId}`;
}

/** candidate_resources(BR-11 Resource∪Opportunity 유니온)의 접두어로 종류를 가른다. */
export function resolveCandidateResource(
  id: string,
):
  | { kind: "resource"; item: Resource }
  | { kind: "opportunity"; item: Opportunity }
  | undefined {
  if (id.startsWith("RES-")) {
    const item = resourceById.get(id);
    return item ? { kind: "resource", item } : undefined;
  }
  if (id.startsWith("OPP-")) {
    const item = opportunityById.get(id);
    return item ? { kind: "opportunity", item } : undefined;
  }
  return undefined;
}
