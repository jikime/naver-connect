#!/usr/bin/env tsx
// 기존 회원 8명 시드를 people 도메인(Need/Offer/ImpactIntent/Consent)으로 무손실 변환한다.
// 사용: npx tsx scripts/migrate-members-to-people.ts
// 원칙: 원문(detail_quote·detail·mission)은 그대로 보존, 시드에 없는 정보는 날조하지 않는다
//       (resource_types 생략, safe_match_text는 draft 상태로 미생성 — 사용자 승인 후 채움).
// idempotent: 결정적 ID·고정 created_at → 재실행해도 같은 출력.
// 근거: plans/generic-mixing-seahorse.md M0-3, people_match_retrieval_plan.md §3

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as T;
}
function writeJson(rel: string, data: unknown): void {
  const abs = join(ROOT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`  ${rel}`);
}

async function run(): Promise<void> {
  console.log("▶ members → people 무손실 변환 시작");
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
  const purposes = [
    "publish_profile",
    "use_private_needs_for_matching",
    "facilitate_introduction",
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

  console.log("▶ 산출물 쓰기");
  writeJson("src/data/people/offers.json", offers);
  writeJson("src/data/people/impact_intents.json", impactIntents);
  writeJson("src/data/private/people/needs.json", needs);
  writeJson("src/data/private/people/consents.json", consents);

  console.log(
    `\n✅ 변환 완료 — offers ${offers.length} · impact ${impactIntents.length} · needs ${needs.length} · consents ${consents.length}`,
  );
}

run().catch((err) => {
  console.error("❌ 변환 실패:", err);
  process.exit(1);
});
