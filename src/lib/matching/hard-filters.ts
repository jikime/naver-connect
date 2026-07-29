// hard filters — 벡터·점수 이전의 자격 게이트. 위반 pair는 점수 계산 자체를 하지 않는다.
// 계약: HardFilterViolationRate = 0 (평가 하니스가 검증). 동의·거절·수용량은 점수가 아니라 필터다.
// 근거: people_match_retrieval_plan.md §10.1(hard filter 최소 목록), research_synthesis.md §10

import type { EngineInput } from "@/lib/matching/engine";

export interface HardFilterResult {
  pass: boolean;
  codes: string[];
}

export function evaluateHardFilters(
  from: string,
  to: string,
  input: EngineInput,
): HardFilterResult {
  const codes: string[] = [];

  if (from === to) codes.push("SELF");

  if (!input.hasMatchingConsent(from) || !input.hasMatchingConsent(to)) {
    codes.push("NO_MATCHING_CONSENT");
  }

  for (const d of input.declines) {
    const samePair =
      (d.fromId === from && d.toId === to) ||
      (d.fromId === to && d.toId === from);
    if (d.reason === "이미아는사이" && samePair) {
      codes.push("DECLINED_KNOWN");
    }
    // 관심없음은 거절한 사람(from)에게 같은 상대를 다시 추천하는 방향만 차단
    if (d.reason === "관심없음" && d.fromId === from && d.toId === to) {
      codes.push("DECLINED_NOT_INTERESTED");
    }
  }

  // 상대의 offer가 존재하는데 전부 paused면 지금은 추천하지 않는다(명시적 중단 신호).
  // offer가 아예 없는 회원은 거울형 연결 가능성을 위해 통과시킨다.
  const toOffers = input.offers.filter(
    (o) => o.owner.id === to && o.status === "active",
  );
  if (
    toOffers.length > 0 &&
    toOffers.every((o) => o.capacity?.status === "paused")
  ) {
    codes.push("CAPACITY_PAUSED");
  }

  // from의 required 제약(지역/방식)은 상대 컨텍스트가 충족해야 한다
  const toCtx = input.personContext[to];
  for (const need of input.needs) {
    if (need.owner.id !== from || need.status !== "active") continue;
    for (const c of need.constraints) {
      if (c.strength !== "required") continue;
      if (
        c.kind === "region" &&
        toCtx &&
        !c.values.includes(toCtx.region.sido)
      ) {
        codes.push("REQUIRED_CONSTRAINT_UNMET");
      }
    }
  }

  return { pass: codes.length === 0, codes: [...new Set(codes)] };
}
