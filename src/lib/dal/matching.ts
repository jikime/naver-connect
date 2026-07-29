// DAL: 매칭(클라이언트 경계) — C3부터 엔진·private 입력은 전부 서버(matching-service)로 이동했다.
// 이 파일은 어떤 시드도 import하지 않는 thin client다: 세션 상태를 스냅샷해 /api/matching에 보내고
// MatchingBundle 최소 DTO만 받는다. 오류 시 조용한 fallback 없이 그대로 throw(fail-closed, §13 규약).
// 계약 불변: getMatchScores/setRuleWeights 시그니처·ForbiddenError·RuleWeight 레버 유지.
// 테스트는 setMatchingTransport로 서비스 함수를 직접 연결한다(src/test/setup.ts).
// 근거: codex final-rereview-reject #1(C3), people_match_retrieval_plan.md §6

import { ForbiddenError } from "@/lib/dal/errors";
import type {
  MatchingBundle,
  MatchingRequest,
  MatchingSessionState,
} from "@/lib/server/matching-service";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  MatchScore,
  Recommendation,
  RuleWeight,
  ViewerContext,
} from "@/types";

export type { MatchingBundle } from "@/lib/server/matching-service";

/** 엔진 추천 ID — 회원 ID에 '-'가 들어가므로 구분자는 ':'를 쓴다. (서비스와 동일 규칙) */
export const ENGINE_REC_PREFIX = "REC-ENG:";

export function parseEngineRecId(
  id: string,
): { recipient: string; other: string } | null {
  if (!id.startsWith(ENGINE_REC_PREFIX)) return null;
  const [, recipient, other] = id.split(":");
  return recipient && other ? { recipient, other } : null;
}

/** 현재 브라우저 세션 상태 스냅샷 — 서버는 상태가 없으므로 요청에 동봉한다(mock auth 전제). */
export function snapshotSessionState(): MatchingSessionState {
  const s = useSessionInteractionStore.getState();
  return {
    onboardingResults: s.onboardingResults,
    recommendationOverrides: s.recommendationOverrides,
    ruleWeightOverrides: s.ruleWeightOverrides,
  };
}

export type MatchingTransport = (
  req: MatchingRequest,
) => Promise<MatchingBundle>;

let transport: MatchingTransport | null = null;

/** 테스트/서버 사이드에서 HTTP 대신 서비스 함수를 직접 연결한다. */
export function setMatchingTransport(t: MatchingTransport | null): void {
  transport = t;
}

async function callMatching(vc: ViewerContext): Promise<MatchingBundle> {
  const req: MatchingRequest = {
    personaId: vc.personaId,
    role: vc.role,
    session: snapshotSessionState(),
  };
  if (transport) return transport(req);
  const res = await fetch("/api/matching", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    // silent fallback 금지 — 매칭 서비스 오류는 그대로 드러낸다.
    throw new Error(`매칭 서비스 오류 (${res.status})`);
  }
  return (await res.json()) as MatchingBundle;
}

/** 추천/그래프 DAL이 한 번의 호출로 재사용하는 번들 조회. */
export async function getMatchingBundle(
  vc: ViewerContext,
): Promise<MatchingBundle> {
  return callMatching(vc);
}

/** persona 수신 엔진 추천(서버 산출 최소 DTO). */
export async function getEngineRecommendationsFor(
  vc: ViewerContext,
): Promise<Recommendation[]> {
  const bundle = await callMatching(vc);
  return bundle.engineRecommendations;
}

/**
 * 매칭 점수 조회(FR-RL-01) — 서버 엔진 산출을 기존 MatchScore 계약으로 반환.
 * 가중치 세션 편집분은 요청에 동봉되어 서버가 재산출한다(FR-RL-03).
 */
export async function getMatchScores(
  vc: ViewerContext,
): Promise<{ scores: MatchScore[]; weights: RuleWeight[] }> {
  const bundle = await callMatching(vc);
  return { scores: bundle.scores, weights: bundle.weights };
}

/**
 * 관리자 가중치 편집(FR-RL-02) + 재산출(FR-RL-03). 운영자가 아니면 403 시뮬레이션.
 * 세션 스토어만 갱신(NFR-02) — 새로고침 시 시드 원본으로 리셋(A6).
 */
export async function setRuleWeights(
  vc: ViewerContext,
  weights: RuleWeight[],
): Promise<{ scores: MatchScore[]; weights: RuleWeight[] }> {
  if (vc.role !== "운영자") {
    throw new ForbiddenError();
  }
  useSessionInteractionStore.getState().setRuleWeightOverrides(weights);
  return getMatchScores(vc);
}
