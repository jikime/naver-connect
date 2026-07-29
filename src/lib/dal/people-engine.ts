// people-engine — 매칭 엔진 전용 전건 접근자. 배럴(index.ts)에서 의도적으로 제외한다:
// 컴포넌트가 import하면 마스킹 없는 민감 Need 전건이 클라이언트에 노출되므로,
// 이 모듈은 src/lib/dal/matching.ts·recommendations.ts와 scripts/에서만 import한다.
// (collaboration-server.ts의 비배럴 선례. eslint T-005는 dal 밖 private 시드 직접 import를 이미 차단.)
// 근거: plans/generic-mixing-seahorse.md M1-6, people_match_retrieval_plan.md §6

import type { DatasetLoader } from "@/lib/dal/datasets";
import type { DatasetKey } from "@/lib/data/dataset-registry";
import { getDatasetDocument } from "@/lib/server/dataset-repository";
import type { ConsentPurpose, ConsentRecordV1, NeedIntentV1 } from "@/types";

const loadServerDataset: DatasetLoader = async <T>(key: DatasetKey) =>
  (await getDatasetDocument<T>(key)).data;

/** 엔진 전용 — 활성 Need 전건. 반환값은 절대 그대로 UI로 흘리지 않는다. */
export async function listActiveNeedIntentsForEngine(
  loadDataset: DatasetLoader = loadServerDataset,
): Promise<NeedIntentV1[]> {
  const needs = await loadDataset<NeedIntentV1[]>("people-needs");
  return needs.filter((n) => n.status === "active");
}

/** 목적별 유효 동의 여부 — 철회(withdrawn_at) 시 즉시 false. hard filter의 1번 게이트. */
export async function hasActiveConsent(
  personId: string,
  purpose: ConsentPurpose,
  loadDataset: DatasetLoader = loadServerDataset,
): Promise<boolean> {
  const consents = await loadDataset<ConsentRecordV1[]>("people-consents");
  return consents.some(
    (c) =>
      c.person_id === personId &&
      c.purpose === purpose &&
      c.withdrawn_at === undefined,
  );
}
