import "server-only";

import { randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import type { PoolClient } from "pg";
import type { AuthenticatedUser } from "@/lib/auth/types";
import type { RegistrationInput } from "@/lib/auth/validation";
import { query, withTransaction } from "@/lib/db";

const PASSWORD_COST = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const dummyHash = hash(randomUUID(), PASSWORD_COST);

interface AuthUserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: AuthenticatedUser["role"];
  status: "active" | "suspended" | "deleted";
  onboarding_completed_at: Date | string | null;
  failed_sign_in_count: number;
  locked_until: Date | string | null;
  session_version: number;
  persona_id: string;
}

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("이미 가입된 이메일입니다.");
    this.name = "EmailAlreadyExistsError";
  }
}

function toAuthenticatedUser(row: AuthUserRow): AuthenticatedUser {
  return {
    id: row.id,
    name: row.display_name,
    email: row.email,
    role: row.role,
    personaId: row.persona_id,
    onboardingComplete: row.onboarding_completed_at !== null,
    sessionVersion: row.session_version,
  };
}

function isLocked(row: AuthUserRow): boolean {
  if (!row.locked_until) return false;
  return new Date(row.locked_until).getTime() > Date.now();
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function recordFailure(row: AuthUserRow): Promise<void> {
  await withTransaction(async (client) => {
    const result = await client.query<{ locked_until: Date | null }>(
      `update ax_private.auth_users
       set failed_sign_in_count = failed_sign_in_count + 1,
           locked_until = case
             when failed_sign_in_count + 1 >= $2
               then now() + make_interval(mins => $3)
             else locked_until
           end
       where id = $1
       returning locked_until`,
      [row.id, MAX_FAILED_ATTEMPTS, LOCK_MINUTES],
    );
    const locked = result.rows[0]?.locked_until !== null;
    await client.query(
      `insert into ax_private.auth_events (auth_user_id, event_type, metadata)
       values ($1, $2, $3::jsonb)`,
      [
        row.id,
        locked ? "account_locked" : "signin_failure",
        JSON.stringify({ reason: "invalid_credentials" }),
      ],
    );
  });
}

export async function authenticateCredentials(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const result = await query<AuthUserRow>(
    `select id, email, password_hash, display_name, role, status,
            onboarding_completed_at, failed_sign_in_count, locked_until,
            session_version, persona_id
     from ax_private.auth_users
     where email = $1
     limit 1`,
    [email],
  );
  const row = result.rows[0];

  if (!row) {
    await compare(password, await dummyHash);
    return null;
  }

  if (row.status !== "active" || isLocked(row)) {
    await compare(password, await dummyHash);
    return null;
  }

  const passwordMatches = await compare(password, row.password_hash);
  if (!passwordMatches) {
    await recordFailure(row);
    return null;
  }

  await withTransaction(async (client) => {
    await client.query(
      `update ax_private.auth_users
       set failed_sign_in_count = 0,
           locked_until = null,
           last_sign_in_at = now()
       where id = $1`,
      [row.id],
    );
    await client.query(
      `insert into ax_private.auth_events (auth_user_id, event_type)
       values ($1, 'signin_success')`,
      [row.id],
    );
  });
  return toAuthenticatedUser(row);
}

export async function createUser(
  input: RegistrationInput,
): Promise<AuthenticatedUser> {
  const passwordHash = await hash(input.password, PASSWORD_COST);
  const id = randomUUID();
  try {
    return await withTransaction(async (client: PoolClient) => {
      const result = await client.query<AuthUserRow>(
        `insert into ax_private.auth_users
           (id, email, password_hash, display_name, role, persona_id)
         values ($1::uuid, $2, $3, $4, $5, $6)
         returning id, email, password_hash, display_name, role, status,
                   onboarding_completed_at, failed_sign_in_count, locked_until,
                   session_version, persona_id`,
        [id, input.email, passwordHash, input.name, input.role, id],
      );
      await client.query(
        `insert into ax_core.profiles (id, display_name, role)
         values ($1, $2, $3)`,
        [id, input.name, input.role],
      );
      await client.query(
        `insert into ax_private.onboarding_profiles (user_id)
         values ($1)`,
        [id],
      );
      await client.query(
        `insert into ax_private.auth_events (auth_user_id, event_type)
         values ($1, 'signup')`,
        [id],
      );
      return toAuthenticatedUser(result.rows[0]);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new EmailAlreadyExistsError();
    throw error;
  }
}

export async function getAuthUserById(
  id: string,
): Promise<AuthenticatedUser | null> {
  const result = await query<AuthUserRow>(
    `select id, email, password_hash, display_name, role, status,
            onboarding_completed_at, failed_sign_in_count, locked_until,
            session_version, persona_id
     from ax_private.auth_users
     where id = $1
     limit 1`,
    [id],
  );
  const row = result.rows[0];
  return row?.status === "active" ? toAuthenticatedUser(row) : null;
}
