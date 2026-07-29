#!/usr/bin/env tsx
// 기존 회원 8명 시드를 people 도메인(Need/Offer/ImpactIntent/Consent)으로 무손실 변환한다.
// 사용: npx tsx scripts/migrate-members-to-people.ts           (실제 쓰기)
//       npx tsx scripts/migrate-members-to-people.ts --check   (결정성 게이트 — 쓰기 없음)
// 원칙: 원문(detail_quote·detail·mission)은 그대로 보존, 시드에 없는 정보는 날조하지 않는다
//       (resource_types 생략, safe_match_text는 draft 상태로 미생성 — 사용자 승인 후 채움).
// idempotent: 결정적 ID·고정 created_at → 재실행해도 같은 출력.
// --check: 산출물 8종(people 시드 4 + derived 4)을 재생성해 커밋본과 byte 비교하고
//          불일치 파일명을 나열한 뒤 exit 1. CI 프라이버시 게이트의 결정성 축.
// 근거: plans/generic-mixing-seahorse.md M0-3, people_match_retrieval_plan.md §3

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

interface MemberPublicSeedRaw {
  id: string;
  member_type: string;
  field_tags: number[];
  mission_statement: string;
  region: { sido: string; sigungu: string };
  visibility: { public: { supply_tags: { tagId: number; detail: string }[] } };
}
interface MemberPrivateSeedRaw {
  member_id: string;
  demand_tags: { tagId: number; priority: boolean; detail_quote: string }[];
}

const ROOT = process.cwd();
const CREATED_AT = "2026-07-29T12:00:00+09:00"; // 마이그레이션 기준 시각(결정적)
const REVISION = 1;
const CHECK_MODE = process.argv.slice(2).includes("--check");

/** 재생성된 산출물(rel 경로 + 정확한 바이트) — check 모드 비교 대상 */
const emitted: { rel: string; bytes: Buffer }[] = [];

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as T;
}
function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
/**
 * 산출물 1건을 생성한다.
 * 기본 모드: 실제 파일에 쓴다. --check 모드: 쓰지 않고 바이트만 모아 뒀다가 나중에 비교한다.
 */
function writeJson(rel: string, data: unknown): void {
  const bytes = Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8");
  emitted.push({ rel, bytes });
  if (!CHECK_MODE) {
    const abs = join(ROOT, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, bytes);
  }
  console.log(`  ${rel}`);
}

/**
 * 재생성 바이트 vs 커밋된 파일 바이트를 비교한다.
 * 하나라도 다르면 파일명을 나열하고 재생성본을 임시 디렉토리에 떨궈 diff 가능하게 한 뒤 exit 1.
 */
function verifyDeterminism(): void {
  console.log("\n▶ 결정성 검사 — 재생성 바이트 vs 커밋본 (sha256)");
  const mismatched: string[] = [];
  for (const { rel, bytes } of emitted) {
    const abs = join(ROOT, rel);
    const actual = sha256(bytes);
    if (!existsSync(abs)) {
      mismatched.push(rel);
      console.log(`  ✗ ${rel}  커밋본 없음 · 재생성 ${actual.slice(0, 16)}`);
      continue;
    }
    const committedBytes = readFileSync(abs);
    const committed = sha256(committedBytes);
    if (committed === actual && committedBytes.equals(bytes)) {
      console.log(`  ✓ ${rel}  ${actual.slice(0, 16)}`);
    } else {
      mismatched.push(rel);
      console.log(
        `  ✗ ${rel}  커밋본 ${committed.slice(0, 16)} ≠ 재생성 ${actual.slice(0, 16)}`,
      );
    }
  }

  const manifest = sha256(
    Buffer.from(
      emitted.map((e) => `${e.rel}:${sha256(e.bytes)}`).join("\n"),
      "utf8",
    ),
  );
  console.log(`  manifest sha256 = ${manifest}`);

  if (mismatched.length > 0) {
    const out = mkdtempSync(join(tmpdir(), "migrate-check-"));
    for (const { rel, bytes } of emitted) {
      const abs = join(out, rel);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, bytes);
    }
    console.error(`\n❌ 결정성 검사 실패 — 불일치 ${mismatched.length}건:`);
    for (const rel of mismatched) console.error(`  ${rel}`);
    console.error(
      `\n재생성본: ${out}\n복구: npx tsx scripts/migrate-members-to-people.ts 후 diff 확인`,
    );
    process.exit(1);
  }
  console.log(
    `\n✅ 결정성 검사 통과 — 산출물 ${emitted.length}종 전부 커밋본과 byte 일치`,
  );
}

async function run(): Promise<void> {
  console.log(
    CHECK_MODE
      ? "▶ members → people 변환 재생성(--check: 쓰기 없음)"
      : "▶ members → people 무손실 변환 시작",
  );
  const pub = readJson<MemberPublicSeedRaw[]>("src/data/members.json");
  const priv = readJson<MemberPrivateSeedRaw[]>(
    "src/data/private/members-private.json",
  );
  const privById = new Map(priv.map((p) => [p.member_id, p]));

  const offers = pub.flatMap((m) =>
    m.visibility.public.supply_tags.map((t, i) => ({
      id: `offer-${m.id}-${t.tagId}-${i}`,
      owner: { kind: "person", id: m.id },
      tag_ids: [t.tagId],
      detail: t.detail,
      status: "active",
      source: "migration",
      profile_revision: REVISION,
      created_at: CREATED_AT,
    })),
  );

  const impactIntents = pub.map((m) => ({
    id: `impact-${m.id}`,
    owner: { kind: "person", id: m.id },
    change_statement: m.mission_statement,
    field_ids: m.field_tags,
    geography: { sido: m.region.sido, sigungu: m.region.sigungu },
    source: "migration",
    profile_revision: REVISION,
    created_at: CREATED_AT,
  }));

  const needs = pub.flatMap((m) => {
    const p = privById.get(m.id);
    if (!p) throw new Error(`private seed 누락: ${m.id}`);
    return p.demand_tags.map((d, i) => ({
      id: `need-${m.id}-${d.tagId}-${i}`,
      owner: { kind: "person", id: m.id },
      tag_ids: [d.tagId],
      detail_quote: d.detail_quote,
      safe_match_status: "draft",
      priority: d.priority ? "primary" : "normal",
      urgency: "active",
      constraints: [],
      status: "active",
      source: "migration",
      profile_revision: REVISION,
      created_at: CREATED_AT,
    }));
  });

  // 시드 회원은 목업이므로 동의도 seed_mock으로 명시 — 실제 동의로 오인 금지.
  // seed_mock 동의는 APP_MODE=demo에서만 유효하다(P1-2 fail-closed).
  const purposes = [
    "publish_profile",
    "use_private_needs_for_matching",
    "facilitate_introduction",
    "quote_in_intro",
  ] as const;
  const consents = pub.flatMap((m) =>
    purposes.map((purpose) => ({
      id: `consent-${m.id}-${purpose}`,
      person_id: m.id,
      purpose,
      policy_version: "consent/0.1-mock",
      consented_at: CREATED_AT,
      source: "seed_mock",
    })),
  );

  // ── 파생(클라이언트 안전) 산출물 — P1-1 번들 유출 차단 ──────────────────
  // 엔진 입력 DTO: 원문(detail_quote)·safe_match_text draft를 일절 포함하지 않는다.
  // match_text는 user_confirmed safe_match_text만 허용 — 시드는 전부 draft라 "".
  const engineNeeds = needs.map((n) => ({
    id: n.id,
    ownerId: n.owner.id,
    tag_ids: n.tag_ids,
    match_text: "",
    priority: n.priority,
    urgency: n.urgency,
    constraints: n.constraints,
    status: n.status,
  }));
  // 동의 자격 요약(불리언만) — consent 레코드 자체는 클라이언트에 싣지 않는다.
  const eligibility = pub.map((m) => ({
    person_id: m.id,
    purposes: [...purposes],
    source: "seed_mock",
  }));

  // legacy private twin은 공개 식별자만 허용한다. 수요 태그/우선순위, hot lead,
  // availability, 추천 이력은 값만 공백화해도 존재 자체가 상태를 노출하므로 전부 제거한다.
  const privateRedacted = priv.map((p) => ({ member_id: p.member_id }));

  console.log(CHECK_MODE ? "▶ 산출물 재생성" : "▶ 산출물 쓰기");
  writeJson("src/data/people/offers.json", offers);
  writeJson("src/data/people/impact_intents.json", impactIntents);
  writeJson("src/data/private/people/needs.json", needs);
  writeJson("src/data/private/people/consents.json", consents);
  writeJson("src/data/people/derived/engine-needs.json", engineNeeds);
  writeJson("src/data/people/derived/matching-eligibility.json", eligibility);
  writeJson(
    "src/data/people/derived/members-private.redacted.json",
    privateRedacted,
  );

  // recommendations 공개 twin — 원본을 scrub하는 방식은 새 민감 필드가 생기면 누출될 수 있다.
  // 필요한 구조 필드만 allowlist로 새 객체에 복사하고 모든 서술/상태는 중립 목업값으로 합성한다.
  const recsRaw = readJson<
    ({
      id: string;
      rec_kind: "1:1" | "모듬";
      from_member_id: string;
      to_member_id: string | null;
      match_type: string;
      value_class: string;
      rec_axis: string;
      authored_direction: string;
      meetup_id?: string;
    } & Record<string, unknown>)[]
  >("src/data/private/recommendations.json");
  const SAFE_COPY = {
    matching_rationale: "공개된 구조 신호만으로 생성된 목업 추천입니다.",
    intro: "새로운 사회혁신 파트너 후보를 확인해 보세요.",
    contact_point: "공개 프로필 기반의 연결 후보",
    your_benefit: "서로의 공개 활동 정보를 확인할 수 있어요.",
    their_benefit: "연결 전 양쪽이 공개 범위를 확인할 수 있어요.",
    first_action: "공개 프로필을 살펴본 뒤 연결 여부를 선택해 보세요.",
  } as const;
  const recsRedacted = recsRaw.map((rec) => ({
    id: rec.id,
    rec_kind: rec.rec_kind,
    from_member_id: rec.from_member_id,
    to_member_id: rec.to_member_id,
    match_type: rec.match_type,
    value_class: rec.value_class,
    rec_axis: rec.rec_axis,
    matching_rationale: SAFE_COPY.matching_rationale,
    message: {
      intro: SAFE_COPY.intro,
      contact_point: SAFE_COPY.contact_point,
      your_benefit: SAFE_COPY.your_benefit,
      their_benefit: SAFE_COPY.their_benefit,
      first_action: SAFE_COPY.first_action,
    },
    is_hot_lead: false,
    min_exposure_note: SAFE_COPY.contact_point,
    authored_direction: rec.authored_direction,
    ...(rec.meetup_id ? { meetup_id: rec.meetup_id } : {}),
    sent_week: "demo",
    status: "pending_review",
  }));
  writeJson(
    "src/data/people/derived/recommendations.redacted.json",
    recsRedacted,
  );

  console.log(
    `\n${CHECK_MODE ? "▶ 재생성" : "✅"} 완료 — offers ${offers.length} · impact ${impactIntents.length} · needs ${needs.length} · consents ${consents.length} · engine-needs(redacted) ${engineNeeds.length}`,
  );

  if (CHECK_MODE) verifyDeterminism();
}

run().catch((err) => {
  console.error(CHECK_MODE ? "❌ 검사 실패:" : "❌ 변환 실패:", err);
  process.exit(1);
});
