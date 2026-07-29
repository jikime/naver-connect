#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hash } from "bcryptjs";
import { REVIEW_ACCOUNTS } from "../src/lib/auth/review-accounts";
import { DATASET_DEFINITIONS } from "../src/lib/data/dataset-registry";
import { createSupabasePool } from "./lib/supabase-db";

const DATA_DIR = join(process.cwd(), "src", "data");
const LOCK_ID = 2_026_072_900_02;
const REVIEW_ACCOUNT_IDS = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000005",
  "00000000-0000-4000-8000-000000000999",
] as const;

interface ReviewMemberProfile {
  id: string;
  org: { name: string; type: string; role: string };
  region: { sido: string; sigungu: string };
  field_tags: number[];
  value_chain_stage: string;
  mission_statement: string;
  visibility: {
    public: {
      supply_tags: { tagId: number; detail: string }[];
      activities: string[];
      preferred_mode: string;
    };
  };
}

function parseDocument(path: string, raw: string): unknown {
  if (path.endsWith(".jsonl")) {
    return raw
      .split(/\r?\n/u)
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as unknown);
  }
  return JSON.parse(raw) as unknown;
}

function recordCount(document: unknown): number {
  if (Array.isArray(document)) return document.length;
  if (document && typeof document === "object") {
    return Object.keys(document).length;
  }
  return 1;
}

async function run() {
  const pool = createSupabasePool({ max: 1 });
  const client = await pool.connect();
  try {
    await client.query("select pg_advisory_lock($1)", [LOCK_ID]);
    await client.query("begin");
    const reviewMembers = parseDocument(
      "members.json",
      readFileSync(join(DATA_DIR, "members.json"), "utf8"),
    ) as ReviewMemberProfile[];

    for (const definition of DATASET_DEFINITIONS) {
      const sourcePath = join(DATA_DIR, definition.path);
      const raw = readFileSync(sourcePath, "utf8");
      const document = parseDocument(definition.path, raw);
      const digest = createHash("sha256").update(raw, "utf8").digest("hex");
      const schema = definition.access === "core" ? "ax_core" : "ax_private";
      await client.query(
        `insert into ${schema}.datasets
           (dataset_key, document, source_path, source_sha256, record_count)
         values ($1, $2::jsonb, $3, $4, $5)
         on conflict (dataset_key) do update
         set document = excluded.document,
             source_path = excluded.source_path,
             source_sha256 = excluded.source_sha256,
             record_count = excluded.record_count,
             revision = case
               when ${schema}.datasets.source_sha256 <> excluded.source_sha256
                 then ${schema}.datasets.revision + 1
               else ${schema}.datasets.revision
             end,
             seeded_at = now()`,
        [
          definition.key,
          JSON.stringify(document),
          `src/data/${definition.path}`,
          digest,
          recordCount(document),
        ],
      );
    }

    for (const [index, account] of REVIEW_ACCOUNTS.entries()) {
      const id = REVIEW_ACCOUNT_IDS[index];
      if (!id) throw new Error(`심사용 계정 UUID가 없습니다: ${account.role}`);
      const passwordHash = await hash(account.password, 12);
      await client.query(
        `insert into ax_private.auth_users
           (id, email, password_hash, display_name, role, persona_id,
            onboarding_completed_at, email_verified_at)
         values ($1, $2, $3, $4, $5, $6, now(), now())
         on conflict (lower(email)) do update
         set password_hash = excluded.password_hash,
             display_name = excluded.display_name,
             role = excluded.role,
             persona_id = excluded.persona_id,
             status = 'active',
             onboarding_completed_at = coalesce(
               ax_private.auth_users.onboarding_completed_at,
               now()
             ),
             email_verified_at = coalesce(
               ax_private.auth_users.email_verified_at,
               now()
             ),
             failed_sign_in_count = 0,
             locked_until = null`,
        [
          id,
          account.email,
          passwordHash,
          account.name,
          account.role,
          account.personaId,
        ],
      );
      const user = await client.query<{ id: string }>(
        "select id from ax_private.auth_users where email = $1",
        [account.email],
      );
      const userId = user.rows[0].id;
      const member = reviewMembers.find(
        (item) => item.id === account.personaId,
      );
      await client.query(
        `insert into ax_core.profiles
           (id, display_name, role, organization_name, organization_type,
            organization_role, region_sido, region_sigungu, field_tag_ids,
            value_chain_stage, mission_statement, supply_tags, activities,
            preferred_mode, profile_visibility)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                 $12::jsonb, $13, $14, 'network')
         on conflict (id) do update
         set display_name = excluded.display_name,
             role = excluded.role,
             organization_name = excluded.organization_name,
             organization_type = excluded.organization_type,
             organization_role = excluded.organization_role,
             region_sido = excluded.region_sido,
             region_sigungu = excluded.region_sigungu,
             field_tag_ids = excluded.field_tag_ids,
             value_chain_stage = excluded.value_chain_stage,
             mission_statement = excluded.mission_statement,
             supply_tags = excluded.supply_tags,
             activities = excluded.activities,
             preferred_mode = excluded.preferred_mode,
             profile_visibility = excluded.profile_visibility`,
        [
          userId,
          account.name,
          account.role,
          member?.org.name ?? null,
          member?.org.type ?? null,
          member?.org.role ?? null,
          member?.region.sido ?? null,
          member?.region.sigungu ?? null,
          member?.field_tags ?? [],
          member?.value_chain_stage ?? null,
          member?.mission_statement ?? null,
          JSON.stringify(member?.visibility.public.supply_tags ?? []),
          member?.visibility.public.activities ?? [],
          member?.visibility.public.preferred_mode ?? null,
        ],
      );
      await client.query(
        `insert into ax_private.onboarding_profiles
           (user_id, profile_revision, draft, consents, completed_at)
         values ($1, 1, $2::jsonb, $3::jsonb, now())
         on conflict (user_id) do update
         set completed_at = coalesce(
           ax_private.onboarding_profiles.completed_at,
           now()
         )`,
        [
          userId,
          JSON.stringify({
            source: "review_account",
            personaId: account.personaId,
          }),
          JSON.stringify({ reviewAccount: true }),
        ],
      );
      await client.query(
        `insert into ax_private.user_runtime_states (user_id)
         values ($1)
         on conflict (user_id) do nothing`,
        [userId],
      );
    }

    await client.query("commit");
    console.log(
      `✅ 데이터셋 ${DATASET_DEFINITIONS.length}개와 심사용 계정 ${REVIEW_ACCOUNTS.length}개 입력 완료`,
    );
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client
      .query("select pg_advisory_unlock($1)", [LOCK_ID])
      .catch(() => {});
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(
    "❌ Supabase 초기 데이터 입력 실패:",
    error instanceof Error ? error.message : "알 수 없는 오류",
  );
  process.exitCode = 1;
});
