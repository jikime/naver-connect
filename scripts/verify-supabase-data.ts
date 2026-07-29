#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compare } from "bcryptjs";
import { REVIEW_ACCOUNTS } from "../src/lib/auth/review-accounts";
import { DATASET_DEFINITIONS } from "../src/lib/data/dataset-registry";
import { createSupabasePool } from "./lib/supabase-db";

interface ReviewAccountRow {
  email: string;
  password_hash: string;
  role: string;
  persona_id: string;
  onboarding_completed_at: Date | null;
}

interface DatasetRow {
  dataset_key: string;
  source_sha256: string;
  access: "core" | "private";
}

const SERVICE_TABLE_NAMES = [
  "auth_users",
  "profiles",
  "onboarding_profiles",
  "auth_events",
  "datasets",
  "user_runtime_states",
] as const;

async function run() {
  const pool = createSupabasePool({ max: 1 });
  try {
    const [datasets, accounts, runtimeStates, publicTables] = await Promise.all(
      [
        pool.query<DatasetRow>(
          `select dataset_key, source_sha256, 'core'::text as access
         from ax_core.datasets
         union all
         select dataset_key, source_sha256, 'private'::text as access
         from ax_private.datasets`,
        ),
        pool.query<ReviewAccountRow>(
          `select email, password_hash, role, persona_id, onboarding_completed_at
         from ax_private.auth_users
         where email = any($1::text[])`,
          [REVIEW_ACCOUNTS.map((account) => account.email)],
        ),
        pool.query<{ count: string }>(
          `select count(*)::text as count
         from ax_private.user_runtime_states s
         join ax_private.auth_users u on u.id = s.user_id
         where u.email = any($1::text[])`,
          [REVIEW_ACCOUNTS.map((account) => account.email)],
        ),
        pool.query<{ table_name: string }>(
          `select table_name
         from information_schema.tables
         where table_schema = 'public'
           and table_name = any($1::text[])`,
          [SERVICE_TABLE_NAMES],
        ),
      ],
    );
    const datasetCount = datasets.rows.length;
    if (datasetCount !== DATASET_DEFINITIONS.length) {
      throw new Error(
        `데이터셋 수 불일치: DB ${datasetCount}개 / 정의 ${DATASET_DEFINITIONS.length}개`,
      );
    }
    for (const definition of DATASET_DEFINITIONS) {
      const row = datasets.rows.find(
        (item) => item.dataset_key === definition.key,
      );
      if (!row) throw new Error(`데이터셋이 없습니다: ${definition.key}`);
      if (row.access !== definition.access) {
        throw new Error(`데이터셋 보안 영역이 다릅니다: ${definition.key}`);
      }
      const raw = readFileSync(
        join(process.cwd(), "src", "data", definition.path),
        "utf8",
      );
      const digest = createHash("sha256").update(raw, "utf8").digest("hex");
      if (row.source_sha256 !== digest) {
        throw new Error(`데이터셋 원본 해시가 다릅니다: ${definition.key}`);
      }
    }
    for (const account of REVIEW_ACCOUNTS) {
      const row = accounts.rows.find((item) => item.email === account.email);
      if (!row) throw new Error(`${account.role} 심사용 계정이 없습니다.`);
      if (row.role !== account.role || row.persona_id !== account.personaId) {
        throw new Error(
          `${account.role} 심사용 계정 역할 연결이 올바르지 않습니다.`,
        );
      }
      if (!row.onboarding_completed_at) {
        throw new Error(
          `${account.role} 심사용 계정의 온보딩이 완료되지 않았습니다.`,
        );
      }
      if (!(await compare(account.password, row.password_hash))) {
        throw new Error(
          `${account.role} 심사용 계정 비밀번호가 일치하지 않습니다.`,
        );
      }
    }
    if (Number(runtimeStates.rows[0]?.count ?? 0) !== REVIEW_ACCOUNTS.length) {
      throw new Error(
        "심사용 계정의 사용자 상태 저장소가 모두 준비되지 않았습니다.",
      );
    }
    if (publicTables.rows.length > 0) {
      throw new Error(
        `public 스키마에 서비스 테이블이 있습니다: ${publicTables.rows
          .map((row) => row.table_name)
          .join(", ")}`,
      );
    }
    console.log(
      `✅ Supabase 데이터 검증 완료 · 데이터셋 ${datasetCount}개 · 심사용 계정 ${accounts.rows.length}개`,
    );
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(
    "❌ Supabase 데이터 검증 실패:",
    error instanceof Error ? error.message : "알 수 없는 오류",
  );
  process.exitCode = 1;
});
