import "server-only";

import { query } from "@/lib/db";
import type { OnboardingResult } from "@/stores/session-interaction";

export const RUNTIME_STATE_KEYS = [
  "recommendationOverrides",
  "onboardingFinalized",
  "ruleWeightOverrides",
  "registeredDeals",
  "onboardingResults",
  "memberEmbeddingShadows",
  "myOrgsOverrides",
  "addedCollabCases",
  "proposalStatusOverrides",
  "recentGalaxyNodes",
  "createdMeetups",
  "joinedMemberIdsByMeetup",
  "availabilityByMeetup",
  "chatMessagesByMeetup",
] as const;

export type RuntimeStateKey = (typeof RUNTIME_STATE_KEYS)[number];

interface RuntimeStateRow {
  state: Record<string, unknown>;
  revision: number;
}

export async function getRuntimeStateForUser(userId: string): Promise<{
  state: Record<string, unknown>;
  revision: number;
}> {
  const result = await query<RuntimeStateRow>(
    `insert into ax_private.user_runtime_states (user_id)
     values ($1)
     on conflict (user_id) do update set user_id = excluded.user_id
     returning state, revision`,
    [userId],
  );
  return result.rows[0] ?? { state: {}, revision: 1 };
}

export async function setRuntimeStateValue(
  userId: string,
  key: RuntimeStateKey,
  value: unknown,
): Promise<{ state: Record<string, unknown>; revision: number }> {
  const result = await query<RuntimeStateRow>(
    `insert into ax_private.user_runtime_states (user_id, state)
     values ($1, jsonb_build_object($2::text, $3::jsonb))
     on conflict (user_id) do update
     set state = jsonb_set(
           ax_private.user_runtime_states.state,
           array[$2::text],
           $3::jsonb,
           true
         ),
         revision = ax_private.user_runtime_states.revision + 1
     returning state, revision`,
    [userId, key, JSON.stringify(value)],
  );
  const row = result.rows[0];
  if (!row) throw new Error("사용자 상태를 저장하지 못했습니다.");
  return row;
}

export async function mergeRuntimeStateForUser(
  userId: string,
  patch: Partial<Record<RuntimeStateKey, unknown>>,
): Promise<{ state: Record<string, unknown>; revision: number }> {
  const result = await query<RuntimeStateRow>(
    `insert into ax_private.user_runtime_states (user_id, state)
     values ($1, $2::jsonb)
     on conflict (user_id) do update
     set state = ax_private.user_runtime_states.state || excluded.state,
         revision = ax_private.user_runtime_states.revision + 1
     returning state, revision`,
    [userId, JSON.stringify(patch)],
  );
  const row = result.rows[0];
  if (!row) throw new Error("사용자 상태를 저장하지 못했습니다.");
  return row;
}

export async function getAllOnboardingResults(): Promise<
  Record<string, OnboardingResult>
> {
  const result = await query<{ persona_id: string; result: unknown }>(
    `select u.persona_id,
            s.state #> array['onboardingResults', u.persona_id] as result
     from ax_private.user_runtime_states s
     join ax_private.auth_users u on u.id = s.user_id
     where u.status = 'active'
       and jsonb_typeof(
         s.state #> array['onboardingResults', u.persona_id]
       ) = 'object'`,
  );
  return Object.fromEntries(
    result.rows.map((row) => [row.persona_id, row.result as OnboardingResult]),
  );
}
