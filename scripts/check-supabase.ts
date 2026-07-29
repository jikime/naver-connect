#!/usr/bin/env tsx

import { createSupabasePool } from "./lib/supabase-db";

async function run() {
  const pool = createSupabasePool({ max: 1 });
  try {
    const result = await pool.query<{
      core_schema: string | null;
      private_schema: string | null;
      auth_table: string | null;
    }>(`
      select
        to_regnamespace('ax_core')::text as core_schema,
        to_regnamespace('ax_private')::text as private_schema,
        to_regclass('ax_private.auth_users')::text as auth_table
    `);
    const state = result.rows[0];
    console.log("✅ Supabase PostgreSQL 연결 성공");
    console.log(
      `   ax_core=${state.core_schema ? "있음" : "없음"} · ax_private=${state.private_schema ? "있음" : "없음"} · auth_users=${state.auth_table ? "있음" : "없음"}`,
    );
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  const directConnectionUnavailable =
    message.includes("ENOTFOUND db.") || message.includes("ENETUNREACH");
  console.error(
    "❌ Supabase 연결 확인 실패:",
    directConnectionUnavailable
      ? "Direct connection은 IPv6가 필요할 수 있습니다. Dashboard > Connect에서 Session pooler(5432) 연결 문자열을 SUPABASE_DATABASE_URL에 입력해주세요."
      : message,
  );
  process.exitCode = 1;
});
