#!/usr/bin/env tsx
// scripts/seed-supabase.ts — JSON 시드 데이터를 Supabase에 마이그레이션한다.
// 실행: npx tsx scripts/seed-supabase.ts
// 중복 실행 안전: ON CONFLICT DO NOTHING으로 이미 존재하는 행은 건너뜀.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dotenv from "dotenv";
import { Pool } from "pg";

// .env.local 로드
dotenv.config({ path: join(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  ssl: { rejectUnauthorized: false },
});

function readJson<T>(filename: string): T {
  const p = join(process.cwd(), "src", "data", filename);
  return JSON.parse(readFileSync(p, "utf-8")) as T;
}

async function run() {
  const client = await pool.connect();
  try {
    console.log("▶ Supabase 연결 성공");

    // ── 1. 스키마 적용 ──────────────────────────────────────
    const schemaSql = readFileSync(
      join(process.cwd(), "scripts", "schema.sql"),
      "utf-8",
    );
    await client.query(schemaSql);
    console.log("▶ 스키마 적용 완료");

    // ── 2. organizations ────────────────────────────────────
    type Org = {
      id: string;
      name: string;
      region: unknown;
      field_tags: number[];
      value_chain_stage_id: number;
      actor_type: string;
      ai_confidence: number;
      source: string;
      verified_by: string[];
      last_checked_at: string;
      member_id: string | null;
      buying_power: number;
      five_force_role: string | null;
      is_public_data?: boolean;
      certification_type?: string;
      employees_count?: number;
    };
    const orgs = readJson<Org[]>("organizations.json");
    for (const o of orgs) {
      await client.query(
        `INSERT INTO organizations
          (id, name, region, field_tags, value_chain_stage_id, actor_type,
           ai_confidence, source, verified_by, last_checked_at, member_id,
           buying_power, five_force_role, is_public_data, certification_type, employees_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO NOTHING`,
        [
          o.id,
          o.name,
          JSON.stringify(o.region),
          o.field_tags,
          o.value_chain_stage_id,
          o.actor_type,
          o.ai_confidence,
          o.source,
          o.verified_by,
          o.last_checked_at,
          o.member_id,
          o.buying_power,
          o.five_force_role,
          o.is_public_data ?? false,
          o.certification_type ?? null,
          o.employees_count ?? null,
        ],
      );
    }
    console.log(`  organizations: ${orgs.length}개 처리`);

    // ── 3. subgroup_map ─────────────────────────────────────
    type SubgroupMapEntry = {
      org_id: string;
      subgroup_code: string;
      subgroup_label: string;
      kind: string;
      rationale: string;
    };
    const subgroupMap = readJson<SubgroupMapEntry[]>("subgroup_map.json");
    for (const s of subgroupMap) {
      await client.query(
        `INSERT INTO subgroup_map (org_id, subgroup_code, subgroup_label, kind, rationale)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (org_id) DO NOTHING`,
        [s.org_id, s.subgroup_code, s.subgroup_label, s.kind, s.rationale],
      );

      // organizations 테이블 subgroup_code 동기화
      await client.query(
        `UPDATE organizations SET subgroup_code = $1 WHERE id = $2`,
        [s.subgroup_code, s.org_id],
      );
    }
    console.log(`  subgroup_map: ${subgroupMap.length}개 처리`);

    // ── 4. collab_cases ─────────────────────────────────────
    type CollabCase = {
      id: string;
      title: string;
      status: string;
      participant_org_ids: string[];
      period: string;
      outcome_summary: string;
      field_tags: number[];
      input_by: string;
    };
    const cases = readJson<CollabCase[]>("collab_cases.json");
    for (const c of cases) {
      await client.query(
        `INSERT INTO collab_cases
          (id, title, status, participant_org_ids, period, outcome_summary, field_tags, input_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [
          c.id,
          c.title,
          c.status,
          c.participant_org_ids,
          c.period,
          c.outcome_summary,
          c.field_tags,
          c.input_by,
        ],
      );
    }
    console.log(`  collab_cases: ${cases.length}개 처리`);

    // ── 5. collab_relations ─────────────────────────────────
    type CollabRelation = {
      id: string;
      org_a_id: string;
      org_b_id: string;
      org_a_subgroup: string;
      org_b_subgroup: string;
      pair_code: string;
      relation_type: string;
      domain_tags: number[];
      strength: number;
      basis_case_id: string | null;
      is_actual: boolean;
      description: string;
    };
    const relations = readJson<CollabRelation[]>("collab_relations.json");
    for (const r of relations) {
      await client.query(
        `INSERT INTO collab_relations
          (id, org_a_id, org_b_id, org_a_subgroup, org_b_subgroup,
           pair_code, relation_type, domain_tags, strength,
           basis_case_id, is_actual, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          r.org_a_id,
          r.org_b_id,
          r.org_a_subgroup,
          r.org_b_subgroup,
          r.pair_code,
          r.relation_type,
          r.domain_tags,
          r.strength,
          r.basis_case_id,
          r.is_actual,
          r.description,
        ],
      );
    }
    console.log(`  collab_relations: ${relations.length}개 처리`);

    // ── 6. 검증 ─────────────────────────────────────────────
    const counts = await client.query<{ tbl: string; cnt: string }>(`
      SELECT 'organizations' AS tbl, COUNT(*)::text AS cnt FROM organizations
      UNION ALL SELECT 'subgroup_map', COUNT(*)::text FROM subgroup_map
      UNION ALL SELECT 'collab_cases', COUNT(*)::text FROM collab_cases
      UNION ALL SELECT 'collab_relations', COUNT(*)::text FROM collab_relations
    `);
    console.log("\n✅ Supabase 시드 완료:");
    for (const row of counts.rows) {
      console.log(`   ${row.tbl}: ${row.cnt}행`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ 시드 실패:", err);
  process.exit(1);
});
