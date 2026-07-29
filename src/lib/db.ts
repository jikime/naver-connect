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
  return new Pool({
    connectionString,
    max: 5,
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
