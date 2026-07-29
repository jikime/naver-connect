#!/usr/bin/env tsx
// evidence 병렬 실행기 — 수집 JSONL(글 단위)을 워커 풀로 추출하고 산출물 3종을 쓴다.
// 사용: npx tsx scripts/evidence/run-extraction.ts <input.jsonl> [outDir=var/evidence] [concurrency=8]
// 입력 계약: EvidencePostInput JSONL (한 줄=한 글, PII 제거본 — 실행기가 재검증·마스킹)
// 산출물(outDir, git 미추적 권장):
//   entity_mentions.jsonl · profile_claims.jsonl(전부 proposed) · link_candidates.jsonl
//   link_candidates.review.md(수동 검토표) · run-manifest.json(추출기 버전·집계)
// 금지 사항 집행: Need/availability claim은 타입에 존재하지 않음 · 자동 병합 없음(needs_review만)
// 근거: Codex 분담 지시(2026-07-29), src/types/evidence.ts 계약

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import fieldsSeed from "../../src/data/fields.json";
import membersSeed from "../../src/data/members.json";
import organizationsSeed from "../../src/data/organizations.json";
import tagsSeed from "../../src/data/tags.json";
import {
  EXTRACTOR,
  type ExtractionResult,
  extractPost,
} from "../../src/lib/evidence/extractor";
import {
  buildLinkCandidates,
  renderReviewTable,
} from "../../src/lib/evidence/link-candidates";
import type { EvidencePostInput } from "../../src/types/evidence";

const [, , inputPath, outDir = "var/evidence", concurrencyArg = "8"] =
  process.argv;

if (!inputPath) {
  console.error(
    "사용: npx tsx scripts/evidence/run-extraction.ts <input.jsonl> [outDir] [concurrency]",
  );
  process.exit(1);
}

const members = membersSeed as {
  id: string;
  name: string;
  org: { name: string };
  region: { sido: string };
  keyword_set: string[];
}[];
const organizations = organizationsSeed as {
  id: string;
  name: string;
  region?: { sido?: string };
}[];

const dict = {
  organizations,
  members: members.map((m) => ({
    id: m.id,
    name: m.name,
    orgName: m.org.name,
    sido: m.region.sido,
    keywords: m.keyword_set,
  })),
  tags: tagsSeed as { id: number; name: string }[],
  fields: fieldsSeed as { id: number; name: string }[],
};

/** 단순 워커 풀 — 글 단위 병렬(순서 무관), 출력은 post_id 정렬로 결정적 */
async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

async function run(): Promise<void> {
  const concurrency = Math.max(1, Number(concurrencyArg) || 8);
  const lines = readFileSync(inputPath, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  const posts = lines.map((l) => JSON.parse(l) as EvidencePostInput);
  console.log(
    `▶ evidence 추출 시작 — 글 ${posts.length}건 · 동시성 ${concurrency} · 추출기 ${EXTRACTOR.name}/${EXTRACTOR.version}`,
  );

  const results = await mapPool(posts, concurrency, async (post) =>
    extractPost(post, dict),
  );
  results.sort((a, b) => a.post_id.localeCompare(b.post_id));

  const mentions = results.flatMap((r: ExtractionResult) => r.mentions);
  const claims = results.flatMap((r) => r.claims);
  const piiViolations = results.reduce((s, r) => s + r.pii_violations, 0);
  const links = buildLinkCandidates(mentions, dict);

  mkdirSync(outDir, { recursive: true });
  const writeJsonl = (name: string, rows: unknown[]) =>
    writeFileSync(
      join(outDir, name),
      `${rows.map((r) => JSON.stringify(r)).join("\n")}\n`,
      "utf8",
    );
  writeJsonl("entity_mentions.jsonl", mentions);
  writeJsonl("profile_claims.jsonl", claims);
  writeJsonl("link_candidates.jsonl", links);
  writeFileSync(
    join(outDir, "link_candidates.review.md"),
    renderReviewTable(links),
    "utf8",
  );
  writeFileSync(
    join(outDir, "run-manifest.json"),
    `${JSON.stringify(
      {
        extractor: EXTRACTOR,
        input: inputPath,
        posts: posts.length,
        mentions: mentions.length,
        claims_proposed: claims.length,
        link_candidates: links.length,
        pii_violations_masked: piiViolations,
        contract:
          "evidence_retrieval_v1 — matching 승격 금지, needs_review only",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `✅ 완료 — mentions ${mentions.length} · claims(proposed) ${claims.length} · link 후보 ${links.length} · PII 마스킹 ${piiViolations}건 → ${outDir}/`,
  );
  if (piiViolations > 0) {
    console.warn(
      "⚠️ 입력에 PII가 남아 있었음 — 수집기 계약(전화·이메일 제거) 위반, Codex에 보고 필요",
    );
  }
}

run().catch((err) => {
  console.error("❌ 추출 실패:", err);
  process.exit(1);
});
