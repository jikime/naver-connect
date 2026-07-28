// src/lib/db.ts — Supabase PostgreSQL 직접 접속 클라이언트 (서버 사이드 전용).
// 브라우저에서 절대 import 금지. Server Components, API Routes, 스크립트에서만 사용.
// pg Pool을 싱글턴으로 관리해 Next.js 핫 리로드 시 커넥션 누수를 방지한다.

import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "[db] DATABASE_URL 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
    );
  }
  return new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: { rejectUnauthorized: false },
  });
}

const pool: Pool =
  process.env.NODE_ENV === "production"
    ? createPool()
    : (globalThis.__pgPool ?? (globalThis.__pgPool = createPool()));

/**
 * 파라미터화된 쿼리 헬퍼.
 * @example
 *   const { rows } = await query<CollabCase>("SELECT * FROM collab_cases WHERE id = $1", [id]);
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<{ rows: T[]; rowCount: number | null }> {
  const client = await pool.connect();
  try {
    const result = await client.query<T & object>(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } finally {
    client.release();
  }
}

export { pool };
