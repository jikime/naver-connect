#!/usr/bin/env tsx
// 빌드 산출물 프라이버시 게이트 — .next/static/chunks에 M0 신규 민감 파일(needs/consents)이
// 실렸는지 검사한다. 원문 문자열은 legacy members-private.json과 중복이라 문자열 매칭으로는
// 출처를 못 가리므로, 파일 구조 시그니처로 판별한다:
//   needs.json   = id:"need-M-…" 인접(300자 내)에 detail_quote 존재 (파생 engine-needs엔 quote 없음)
//   consents.json = id:"consent-M-…" (파생 eligibility엔 id 없음)
// 사용: npm run build && npx tsx scripts/check-bundle-privacy.ts   (위반 시 exit 1)
// baseline 부채(별도 판정 대기): members-private.json은 base 3c9d275부터 members.ts 경유로
// 번들되어 온 구조 — 이 게이트는 리포트만 하고 실패 조건에서 제외한다(Codex 판정 요청 중).
// 근거: codex-m0m1-review-changes-requested P1-1

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CHUNKS = join(ROOT, ".next", "static", "chunks");

function chunkFiles(): string[] {
  return readdirSync(CHUNKS, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".js"))
    .map((f) => join(CHUNKS, f));
}

/** id 마커 인접 창(window) 안에 quoteKey가 있으면 해당 원본 파일의 레코드로 판정 */
function hasRecordSignature(
  body: string,
  idMarker: string,
  quoteKey: string | null,
  window = 300,
): boolean {
  let idx = body.indexOf(idMarker);
  while (idx !== -1) {
    if (quoteKey === null) return true;
    if (body.slice(idx, idx + window).includes(quoteKey)) return true;
    idx = body.indexOf(idMarker, idx + 1);
  }
  return false;
}

async function run(): Promise<void> {
  console.log("▶ 번들 프라이버시 검사 (.next/static/chunks)");
  const files = chunkFiles();
  const violations: { what: string; file: string }[] = [];

  // raw quote 전수(신규 needs + legacy members-private + hot_lead 서술) — 전부 위반 조건.
  // 클라이언트는 redacted twin(원문 "")만 실으므로 원문 문자열이 보이면 즉시 실패(Codex 추가 기준).
  const needs = JSON.parse(
    readFileSync(join(ROOT, "src/data/private/people/needs.json"), "utf8"),
  ) as { detail_quote: string }[];
  const legacy = JSON.parse(
    readFileSync(join(ROOT, "src/data/private/members-private.json"), "utf8"),
  ) as {
    demand_tags: { detail_quote: string }[];
    hot_lead: { project_summary: string; needed_partner: string } | null;
  }[];
  // needed_partner는 시드 설계상 min_exposure_note(승인된 최소노출 문구)에 공식 재사용되는
  // 축약 표현이라 raw quote로 취급하지 않는다. 서술 원문(detail_quote·project_summary)만 검사.
  const rawQuotes = new Set(
    [
      ...needs.map((n) => n.detail_quote),
      ...legacy.flatMap((m) => m.demand_tags.map((d) => d.detail_quote)),
      ...legacy.flatMap((m) =>
        m.hot_lead ? [m.hot_lead.project_summary] : [],
      ),
    ].filter((q) => q && q.length >= 6),
  );

  for (const file of files) {
    const body = readFileSync(file, "utf8");
    for (const quote of rawQuotes) {
      if (body.includes(quote)) {
        violations.push({ what: `raw quote: ${quote.slice(0, 18)}…`, file });
      }
    }
    if (hasRecordSignature(body, 'id:"need-M-', "detail_quote")) {
      violations.push({ what: "needs.json 레코드 직렬화", file });
    }
    if (
      hasRecordSignature(body, 'id:"consent-M-', null) ||
      hasRecordSignature(body, '"consent-M-', null)
    ) {
      violations.push({ what: "consents.json 레코드", file });
    }
  }

  console.log(`  검사 파일 ${files.length}개 · raw quote probe ${rawQuotes.size}개`);

  if (violations.length > 0) {
    console.error(`\n❌ 번들 프라이버시 위반 ${violations.length}건:`);
    for (const v of violations.slice(0, 12)) {
      console.error(`  [${v.what}] ${v.file}`);
    }
    process.exit(1);
  }
  console.log(
    "\n✅ 위반 0건 — 신규(needs/consents)·legacy(members-private) raw quote 모두 번들 미포함",
  );
}

run().catch((err) => {
  console.error("❌ 검사 실패:", err);
  process.exit(1);
});
