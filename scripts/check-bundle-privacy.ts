#!/usr/bin/env tsx
// 빌드 산출물 프라이버시 게이트.
// 1) derived JSON 자체를 allowlist 계약으로 검사하고,
// 2) private 원본의 알려진 서술 문구 및 private 레코드 시그니처가 client chunk에
//    포함되지 않았는지 검사한다.
// 사용: npm run build && npx tsx scripts/check-bundle-privacy.ts   (위반 시 exit 1)
// 근거: codex-m0m1-review-changes-requested P1-1

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CHUNKS = join(ROOT, ".next", "static", "chunks");
const DERIVED_RECOMMENDATIONS = join(
  ROOT,
  "src/data/people/derived/recommendations.redacted.json",
);
const DERIVED_MEMBERS_PRIVATE = join(
  ROOT,
  "src/data/people/derived/members-private.redacted.json",
);

const SAFE_RECOMMENDATION_COPY = new Set([
  "공개된 구조 신호만으로 생성된 목업 추천입니다.",
  "새로운 사회혁신 파트너 후보를 확인해 보세요.",
  "공개 프로필 기반의 연결 후보",
  "서로의 공개 활동 정보를 확인할 수 있어요.",
  "연결 전 양쪽이 공개 범위를 확인할 수 있어요.",
  "공개 프로필을 살펴본 뒤 연결 여부를 선택해 보세요.",
]);
const RECOMMENDATION_KEYS = new Set([
  "id",
  "rec_kind",
  "from_member_id",
  "to_member_id",
  "match_type",
  "value_class",
  "rec_axis",
  "matching_rationale",
  "message",
  "is_hot_lead",
  "min_exposure_note",
  "authored_direction",
  "meetup_id",
  "sent_week",
  "status",
]);
const MESSAGE_KEYS = new Set([
  "intro",
  "contact_point",
  "your_benefit",
  "their_benefit",
  "first_action",
]);
const DISALLOWED_RECOMMENDATION_KEYS = [
  "meeting_outcome",
  "decline_reason",
  "decline_note",
  "reason_pointers",
];

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

function unexpectedKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
): string[] {
  return Object.keys(value).filter((key) => !allowed.has(key));
}

function validateDerivedArtifacts(
  violations: { what: string; file: string }[],
): void {
  const recommendations = JSON.parse(
    readFileSync(DERIVED_RECOMMENDATIONS, "utf8"),
  ) as Record<string, unknown>[];
  for (const rec of recommendations) {
    const extra = unexpectedKeys(rec, RECOMMENDATION_KEYS);
    if (extra.length > 0) {
      violations.push({
        what: `recommendation allowlist 밖 key: ${extra.join(",")}`,
        file: DERIVED_RECOMMENDATIONS,
      });
    }
    const message = rec.message as Record<string, unknown> | undefined;
    if (!message || unexpectedKeys(message, MESSAGE_KEYS).length > 0) {
      violations.push({
        what: "recommendation message allowlist 위반",
        file: DERIVED_RECOMMENDATIONS,
      });
    }
    const narratives = [
      rec.matching_rationale,
      rec.min_exposure_note,
      ...Object.values(message ?? {}),
    ];
    if (
      narratives.some(
        (value) =>
          typeof value !== "string" || !SAFE_RECOMMENDATION_COPY.has(value),
      ) ||
      rec.is_hot_lead !== false ||
      rec.status !== "pending_review" ||
      rec.sent_week !== "demo"
    ) {
      violations.push({
        what: `recommendation 중립 DTO 위반: ${String(rec.id)}`,
        file: DERIVED_RECOMMENDATIONS,
      });
    }
    for (const key of DISALLOWED_RECOMMENDATION_KEYS) {
      if (key in rec) {
        violations.push({
          what: `recommendation 금지 key: ${key}`,
          file: DERIVED_RECOMMENDATIONS,
        });
      }
    }
  }

  const members = JSON.parse(
    readFileSync(DERIVED_MEMBERS_PRIVATE, "utf8"),
  ) as Record<string, unknown>[];
  for (const member of members) {
    const extra = unexpectedKeys(member, new Set(["member_id"]));
    if (extra.length > 0) {
      violations.push({
        what: `member private allowlist 밖 key: ${extra.join(",")}`,
        file: DERIVED_MEMBERS_PRIVATE,
      });
    }
  }
}

async function run(): Promise<void> {
  console.log("▶ 번들 프라이버시 검사 (.next/static/chunks)");
  const files = chunkFiles();
  const violations: { what: string; file: string }[] = [];
  validateDerivedArtifacts(violations);

  // private 사람 원문과 recommendation 서술 전문은 길이 6자 이상 문구를 probe한다.
  const needs = JSON.parse(
    readFileSync(join(ROOT, "src/data/private/people/needs.json"), "utf8"),
  ) as { detail_quote: string }[];
  const legacy = JSON.parse(
    readFileSync(join(ROOT, "src/data/private/members-private.json"), "utf8"),
  ) as {
    demand_tags: { detail_quote: string }[];
    hot_lead: {
      project_summary: string;
      needed_partner: string;
      stage: string;
    } | null;
    availability: string;
  }[];
  const rawRecommendations = JSON.parse(
    readFileSync(join(ROOT, "src/data/private/recommendations.json"), "utf8"),
  ) as {
    matching_rationale: string;
    min_exposure_note: string;
    message: Record<string, string>;
    decline_note?: string;
    meeting_outcome?: { note?: string };
  }[];
  const rawQuotes = new Set(
    [
      ...needs.map((n) => n.detail_quote),
      ...legacy.flatMap((m) => m.demand_tags.map((d) => d.detail_quote)),
      ...legacy.flatMap((m) =>
        m.hot_lead
          ? [
              m.hot_lead.project_summary,
              m.hot_lead.needed_partner,
              m.hot_lead.stage,
            ]
          : [],
      ),
      ...rawRecommendations.flatMap((rec) => [
        rec.matching_rationale,
        rec.min_exposure_note,
        ...Object.values(rec.message),
        rec.decline_note ?? "",
        rec.meeting_outcome?.note ?? "",
      ]),
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
    for (const key of DISALLOWED_RECOMMENDATION_KEYS) {
      if (
        hasRecordSignature(body, 'id:"REC-', key, 2400) ||
        hasRecordSignature(body, '"id":"REC-', `"${key}"`, 2400)
      ) {
        violations.push({
          what: `recommendation private state key: ${key}`,
          file,
        });
      }
    }
    if (
      (hasRecordSignature(body, 'member_id:"M-', "availability", 700) ||
        hasRecordSignature(body, '"member_id":"M-', '"availability"', 700)) &&
      (body.includes("recommendation_history") || body.includes("hot_lead"))
    ) {
      violations.push({
        what: "members-private 파생 레코드 시그니처",
        file,
      });
    }
    // C3: 매칭 입력은 서버 전용 — 아래 시그니처가 클라 청크에 보이면 경계 붕괴.
    if (
      hasRecordSignature(body, 'ownerId:"M-', "match_text", 400) ||
      hasRecordSignature(body, '"ownerId":"M-', '"match_text"', 400)
    ) {
      violations.push({ what: "engine-needs 파생(폐기됨) 시그니처", file });
    }
    if (
      hasRecordSignature(body, 'person_id:"M-', "purposes", 300) ||
      hasRecordSignature(body, '"person_id":"M-', '"purposes"', 300)
    ) {
      violations.push({
        what: "matching-eligibility 파생(폐기됨) 시그니처",
        file,
      });
    }
    if (body.includes("rule_weights")) {
      violations.push({
        what: "match_scores(rule_weights) private 시드",
        file,
      });
    }
  }

  console.log(
    `  검사 파일 ${files.length}개 · private phrase probe ${rawQuotes.size}개 · derived allowlist 2종`,
  );

  if (violations.length > 0) {
    console.error(`\n❌ 번들 프라이버시 위반 ${violations.length}건:`);
    for (const v of violations.slice(0, 12)) {
      console.error(`  [${v.what}] ${v.file}`);
    }
    process.exit(1);
  }
  console.log(
    "\n✅ 위반 0건 — derived allowlist 준수, private 서술·상태 key client bundle 미포함",
  );
}

run().catch((err) => {
  console.error("❌ 검사 실패:", err);
  process.exit(1);
});
