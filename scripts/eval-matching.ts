#!/usr/bin/env tsx
// 매칭 baseline 평가 리포트 — 결합식 3종 비교표 + 커버리지 + 안전 불변식 요약.
// 사용: npx tsx scripts/eval-matching.ts
// ⚠️ n=8 회원·시드 추천 11건은 regression smoke이지 품질 gold가 아니다 — 수치를 품질 근거로 인용 금지.
//    (하드 검증은 vitest src/lib/matching/harness.test.ts가 담당 — 이 스크립트는 사람이 읽는 비교표)
// 근거: people_match_retrieval_plan.md §8, plans/generic-mixing-seahorse.md M1-9

// 데모 리포트 전용 스크립트 — seed_mock 동의를 신뢰하는 demo 모드를 명시 선언(P1-2 게이트와 정합).
process.env.NEXT_PUBLIC_APP_MODE ??= "demo";

import membersSeed from "../src/data/members.json";
import needsSeed from "../src/data/private/people/needs.json";
import {
  buildEngineRecommendationsFor,
  runMatchingEngine,
} from "../src/lib/dal/matching";
import { COMMON_WEIGHT, RECIPROCAL_WEIGHT } from "../src/lib/matching/engine";

type CombineKey = "min" | "geometric" | "harmonic";
const COMBINES: CombineKey[] = ["min", "geometric", "harmonic"];

/** P2-2: variant별로 동일한 최종식(0.75*결합 + 0.25*공통 + 가중치)을 재계산해 비교한다. */
function variantScore(
  p: ReturnType<typeof runMatchingEngine>["output"]["pairs"][number],
  combine: CombineKey,
): number {
  const raw = Math.max(
    0,
    Math.min(
      1,
      RECIPROCAL_WEIGHT * p.reciprocal[combine] +
        COMMON_WEIGHT * p.common +
        p.boost,
    ),
  );
  return Math.round(raw * 100);
}

function topKByCombine(
  pairs: ReturnType<typeof runMatchingEngine>["output"]["pairs"],
  persona: string,
  combine: CombineKey,
  k = 3,
): string[] {
  return pairs
    .filter((p) => p.from === persona)
    .sort((a, b) => variantScore(b, combine) - variantScore(a, combine))
    .slice(0, k)
    .map((p) => `${p.to}(${variantScore(p, combine)})`);
}

async function run(): Promise<void> {
  const members = membersSeed as { id: string; name: string }[];
  const needs = needsSeed as { detail_quote: string }[];
  const { output } = runMatchingEngine();

  console.log("▶ 매칭 baseline 평가 리포트 (n=8 — smoke 전용, 품질 gold 아님)");
  console.log(
    `  전수 방향 pair: ${output.pairs.length + output.filtered.length} · 순위 진입 ${output.pairs.length} · 필터 제외 ${output.filtered.length}`,
  );

  // 필터 사유 분포
  const codeCount = new Map<string, number>();
  for (const f of output.filtered) {
    for (const c of f.codes) codeCount.set(c, (codeCount.get(c) ?? 0) + 1);
  }
  console.log("  필터 사유:", Object.fromEntries(codeCount));

  // 결합식 3종 Top-3 비교 — 순위가 갈리는 지점이 gold set 라벨링 1순위 대상
  console.log("\n▶ 결합식별 Top-3 비교 (min / geometric / harmonic)");
  let disagreements = 0;
  for (const m of members) {
    const rows = COMBINES.map((c) => topKByCombine(output.pairs, m.id, c));
    const same =
      JSON.stringify(rows[0].map((r) => r.split("(")[0])) ===
        JSON.stringify(rows[1].map((r) => r.split("(")[0])) &&
      JSON.stringify(rows[1].map((r) => r.split("(")[0])) ===
        JSON.stringify(rows[2].map((r) => r.split("(")[0]));
    if (!same) disagreements += 1;
    console.log(`  ${m.id} ${same ? " " : "≠"}`);
    COMBINES.forEach((c, i) => {
      console.log(`     ${c.padEnd(9)} ${rows[i].join("  ")}`);
    });
  }
  console.log(
    `  → Top-3 구성이 결합식에 따라 달라지는 회원: ${disagreements}/8 (≠ 표시 pair가 blind label 우선 대상)`,
  );

  // 커버리지 + 안전 요약(정본 검증은 harness.test.ts)
  console.log("\n▶ 커버리지·안전 요약");
  const uncovered = members.filter(
    (m) => buildEngineRecommendationsFor(m.id).length === 0,
  );
  console.log(`  엔진 추천 0건 회원: ${uncovered.length}명`);
  const quotes = needs.map((n) => n.detail_quote).filter((q) => q.length >= 8);
  let leaks = 0;
  for (const m of members) {
    const payload = JSON.stringify(buildEngineRecommendationsFor(m.id));
    for (const q of quotes) if (payload.includes(q)) leaks += 1;
  }
  console.log(`  비공개 원문 누출: ${leaks}건`);

  if (uncovered.length > 0 || leaks > 0) {
    console.error("\n❌ 불변식 위반 — harness.test.ts를 확인하세요");
    process.exit(1);
  }
  console.log(
    "\n✅ 리포트 완료 — 다음 단계: 결합식 분기 pair에 대한 blind pair label(도메인 검토자 2~3명) 수집",
  );
}

run().catch((err) => {
  console.error("❌ 평가 실패:", err);
  process.exit(1);
});
