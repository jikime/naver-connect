import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var __axPostgresPool: Pool | undefined;
}

function databaseUrl(): string {
  const value = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!value) {
    throw new Error(
      "SUPABASE_DATABASE_URL 환경변수가 없습니다. .env.local을 확인해주세요.",
    );
  }
  return value;
}

function createPool(): Pool {
  const connectionString = databaseUrl();
  const isLocal = /(?:localhost|127\.0\.0\.1|host\.docker\.internal)/.test(
    connectionString,
  );
  // Vercel 함수는 인스턴스가 수평 확장되므로 각 인스턴스가 여러 연결을 오래
  // 보유하면 Supavisor 한도를 빠르게 소진한다. 운영은 Transaction pooler(6543)와
  // 프로세스당 연결 1개를 조합하고, 로컬의 장기 실행 서버만 작은 풀을 사용한다.
  const maxConnections = process.env.VERCEL === "1" ? 1 : 5;
  return new Pool({
    connectionString,
    max: maxConnections,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

function getPool(): Pool {
  if (!globalThis.__axPostgresPool) {
    globalThis.__axPostgresPool = createPool();
  }
  return globalThis.__axPostgresPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<{ rows: T[]; rowCount: number | null }> {
  const result = await getPool().query<T>(text, [...params]);
  return { rows: result.rows, rowCount: result.rowCount };
}

export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
