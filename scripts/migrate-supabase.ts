#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createSupabasePool } from "./lib/supabase-db";

const MIGRATION_DIR = join(process.cwd(), "supabase", "migrations");
const LOCK_ID = 2_026_072_900_01;

function checksum(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function run() {
  const pool = createSupabasePool({ max: 1 });
  const client = await pool.connect();
  try {
    await client.query("select pg_advisory_lock($1)", [LOCK_ID]);
    await client.query("create schema if not exists ax_private");
    await client.query(`
      create table if not exists ax_private.schema_migrations (
        version text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const files = readdirSync(MIGRATION_DIR)
      .filter((name) => name.endsWith(".sql"))
      .sort();
    if (files.length === 0) {
      throw new Error("적용할 Supabase SQL 마이그레이션이 없습니다.");
    }

    for (const file of files) {
      const sql = readFileSync(join(MIGRATION_DIR, file), "utf8");
      const digest = checksum(sql);
      const existing = await client.query<{ checksum: string }>(
        "select checksum from ax_private.schema_migrations where version = $1",
        [file],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== digest) {
          throw new Error(`이미 적용된 마이그레이션이 변경되었습니다: ${file}`);
        }
        console.log(`  건너뜀 ${file}`);
        continue;
      }

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into ax_private.schema_migrations (version, checksum) values ($1, $2)",
          [file, digest],
        );
        await client.query("commit");
        console.log(`  적용 ${file}`);
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
    console.log(`✅ Supabase 마이그레이션 ${files.length}개 확인 완료`);
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
    "❌ Supabase 마이그레이션 실패:",
    error instanceof Error ? error.message : "알 수 없는 오류",
  );
  process.exitCode = 1;
});
