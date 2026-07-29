// DAL: 운영자 검수 — 전건 검수 큐 조회 + 승인. 비운영자는 403 시뮬레이션.
// 근거: ARCHITECTURE.md §5.2/§5.3 접근제어 계약, FR-OP-01/02/03/04, BR-05(전건 검수)

import { getDataset } from "@/lib/dal/datasets";
import { ForbiddenError } from "@/lib/dal/errors";
import {
  hydrateRuntimeState,
  setRuntimeStateValue,
} from "@/lib/dal/runtime-state";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type { Recommendation, ViewerContext } from "@/types";

function withOverride(rec: Recommendation): Recommendation {
  const override =
    useSessionInteractionStore.getState().recommendationOverrides[rec.id];
  return override ? { ...rec, ...override } : rec;
}

/**
 * 검수 큐(FR-OP-01/02/03): draft/pending_review 전건. 운영자가 아니면 403 시뮬레이션(reject).
 */
export async function getReviewQueue(
  vc: ViewerContext,
): Promise<Recommendation[]> {
  if (vc.role !== "운영자") {
    throw new ForbiddenError();
  }
  await hydrateRuntimeState();
  const seed = await getDataset<Recommendation[]>("recommendations-redacted");
  return seed
    .map(withOverride)
    .filter((rec) => rec.status === "draft" || rec.status === "pending_review");
}

/**
 * 검수 승인(FR-OP-04): draft/pending_review → sent 전이. 운영자가 아니면 403 시뮬레이션.
 * 운영자 계정의 서버 상태에 저장하고 화면 캐시를 갱신한다.
 */
export async function approveRecommendation(
  vc: ViewerContext,
  recId: string,
): Promise<Recommendation> {
  if (vc.role !== "운영자") {
    throw new ForbiddenError();
  }
  const state = await hydrateRuntimeState();
  const seed = await getDataset<Recommendation[]>("recommendations-redacted");
  const rec = seed.find((r) => r.id === recId);
  if (!rec) {
    throw new Error(`Recommendation not found: ${recId}`);
  }
  await setRuntimeStateValue("recommendationOverrides", {
    ...state.recommendationOverrides,
    [recId]: {
      ...state.recommendationOverrides[recId],
      status: "sent",
    },
  });
  return withOverride(rec);
}

/**
 * 검수 반려(FR-OP-01/04, approveRecommendation과 대칭): draft/pending_review → rejected 전이.
 * 운영자가 아니면 거부한다. 반려 상태는 서버에 저장되며 다음 조회부터 큐에서 사라진다.
 */
export async function rejectRecommendation(
  vc: ViewerContext,
  recId: string,
): Promise<Recommendation> {
  if (vc.role !== "운영자") {
    throw new ForbiddenError();
  }
  const state = await hydrateRuntimeState();
  const seed = await getDataset<Recommendation[]>("recommendations-redacted");
  const rec = seed.find((r) => r.id === recId);
  if (!rec) {
    throw new Error(`Recommendation not found: ${recId}`);
  }
  await setRuntimeStateValue("recommendationOverrides", {
    ...state.recommendationOverrides,
    [recId]: {
      ...state.recommendationOverrides[recId],
      status: "rejected",
    },
  });
  return withOverride(rec);
}
