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

  // legacy members-private의 redacted twin — 클라이언트(members.ts)는 이것만 import한다.
  // 원문 서술 필드(detail_quote·hot_lead 3필드)는 전부 공백화, 구조·태그·범주값은 보존.
  // (Codex 추가 기준: legacy raw quote도 번들 0건 — baseline debt 불허)
  const privateRedacted = priv.map((p) => {
    const full = p as MemberPrivateSeedRaw & {
      hot_lead: {
        flag: boolean;
        project_summary: string;
        needed_partner: string;
        stage: string;
      } | null;
      availability: string;
      recommendation_history: string[];
    };
    return {
      member_id: full.member_id,
      demand_tags: full.demand_tags.map((d) => ({
        tagId: d.tagId,
        priority: d.priority,
        detail_quote: "",
      })),
      hot_lead: full.hot_lead
        ? {
            flag: full.hot_lead.flag,
            project_summary: "",
            needed_partner: "",
            stage: "",
          }
        : null,
      availability: full.availability,
      recommendation_history: full.recommendation_history,
    };
  });

  console.log("▶ 산출물 쓰기");
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

  // recommendations.json redacted twin — contact_point 등 수요 원문 인용 필드를 최소노출
  // 문구로 치환하고, 잔여 원문 문자열은 전 필드 스캔으로 소거한다(raw quote 번들 0건 기준).
  const rawQuoteSet = [
    ...needs.map((n) => n.detail_quote),
    ...pub.flatMap((m) => {
      const p = privById.get(m.id) as unknown as {
        hot_lead: { project_summary: string; needed_partner: string } | null;
      };
      return p.hot_lead
        ? [p.hot_lead.project_summary, p.hot_lead.needed_partner]
        : [];
    }),
  ].filter((q) => q && q.length >= 6);
  const recsRaw = readJson<
    ({ min_exposure_note: string; message: { contact_point: string } } & Record<
      string,
      unknown
    >)[]
  >("src/data/private/recommendations.json");
  const scrub = (value: string, fallback: string): string => {
    let out = value;
    for (const q of rawQuoteSet) {
      if (out.includes(q)) out = fallback;
    }
    return out;
  };
  const recsRedacted = recsRaw.map((rec) => {
    const fallback = rec.min_exposure_note;
    const scrubDeep = (v: unknown): unknown => {
      if (typeof v === "string") return scrub(v, fallback);
      if (Array.isArray(v)) return v.map(scrubDeep);
      if (v && typeof v === "object") {
        return Object.fromEntries(
          Object.entries(v).map(([k, val]) => [k, scrubDeep(val)]),
        );
      }
      return v;
    };
    const cleaned = scrubDeep(rec) as typeof rec;
    cleaned.message.contact_point = rec.min_exposure_note; // 원문 인용 필드는 무조건 치환
    return cleaned;
  });
  writeJson(
    "src/data/people/derived/recommendations.redacted.json",
    recsRedacted,
  );

  console.log(
    `\n✅ 변환 완료 — offers ${offers.length} · impact ${impactIntents.length} · needs ${needs.length} · consents ${consents.length} · engine-needs(redacted) ${engineNeeds.length}`,
  );
}

run().catch((err) => {
  console.error("❌ 변환 실패:", err);
  process.exit(1);
});
