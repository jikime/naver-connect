import { loadEnvConfig } from "@next/env";
import { Pool, type PoolConfig } from "pg";

let envLoaded = false;

function loadProjectEnv() {
  if (envLoaded) return;
  loadEnvConfig(process.cwd());
  envLoaded = true;
}

export function getSupabaseDatabaseUrl(): string {
  loadProjectEnv();
  const url = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      ".env.local의 SUPABASE_DATABASE_URL을 입력해주세요. 브라우저 공개 키가 아니라 Database connection string이 필요합니다.",
    );
  }
  return url;
}

export function createSupabasePool(options?: Pick<PoolConfig, "max">): Pool {
  const connectionString = getSupabaseDatabaseUrl();
  const isLocal = /(?:localhost|127\.0\.0\.1|host\.docker\.internal)/.test(
    connectionString,
  );
  return new Pool({
    connectionString,
    max: options?.max ?? 3,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });
}
