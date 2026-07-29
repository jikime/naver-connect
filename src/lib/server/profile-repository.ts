import "server-only";

import type { PoolClient } from "pg";
import type { UserRole } from "@/lib/auth/types";
import { query, withTransaction } from "@/lib/db";
import { onboardingFinalizeSchema } from "@/lib/onboarding/validation";
import type { MaskedMember, OnboardingFinalizeInput } from "@/types";

interface ProfileRow {
  id: string;
  display_name: string;
  role: UserRole;
  organization_name: string | null;
  organization_type: string | null;
  organization_role: string | null;
  region_sido: string | null;
  region_sigungu: string | null;
  field_tag_ids: number[];
  value_chain_stage: string | null;
  mission_statement: string | null;
  supply_tags: { tagId: number; detail: string }[];
  activities: string[];
  preferred_mode: string | null;
  onboarding_completed_at: Date | string | null;
  draft: unknown;
}

export interface UserProfileState {
  member: MaskedMember;
  onboardingComplete: boolean;
  onboarding: OnboardingFinalizeInput | null;
}

function parseOnboarding(row: ProfileRow): OnboardingFinalizeInput | null {
  const parsed = onboardingFinalizeSchema.safeParse(row.draft);
  return parsed.success ? parsed.data : null;
}

function rowToMember(
  row: ProfileRow,
  onboarding: OnboardingFinalizeInput | null,
): MaskedMember {
  if (row.role === "운영자") {
    throw new Error("운영자 계정에는 회원 프로필이 없습니다.");
  }
  return {
    id: row.id,
    name: row.display_name,
    member_type: row.role,
    expert_subtype: null,
    org: {
      name: row.organization_name ?? "",
      type: row.organization_type ?? "",
      role: row.organization_role ?? "",
    },
    region: {
      sido: row.region_sido ?? "",
      sigungu: row.region_sigungu ?? "",
    },
    field_tags: row.field_tag_ids,
    value_chain_stage: row.value_chain_stage ?? "",
    mission_statement: row.mission_statement ?? "",
    trust_connections: onboarding?.trust_connections ?? [],
    hot_lead: onboarding?.hot_lead?.flag ?? false,
    keyword_set: [],
    affiliation_org_id: null,
    target_org_ids: [],
    visibility: {
      public: {
        supply_tags: row.supply_tags,
        activities: row.activities,
        preferred_mode: row.preferred_mode ?? "",
        region: {
          sido: row.region_sido ?? "",
          sigungu: row.region_sigungu ?? "",
        },
      },
      private: {
        demand_tags: onboarding?.demand_tags ?? [],
        hot_lead: onboarding?.hot_lead ?? null,
        availability: onboarding?.availability ?? "",
        recommendation_history: [],
      },
    },
  };
}

export async function getProfileForUser(
  userId: string,
): Promise<MaskedMember | null> {
  const state = await getProfileStateForUser(userId);
  return state?.member ?? null;
}

export async function getProfileStateForUser(
  userId: string,
): Promise<UserProfileState | null> {
  const result = await query<ProfileRow>(
    `select a.persona_id as id, p.display_name, p.role, p.organization_name,
            p.organization_type, p.organization_role, p.region_sido,
            p.region_sigungu, p.field_tag_ids, p.value_chain_stage,
            p.mission_statement, p.supply_tags, p.activities,
            p.preferred_mode, a.onboarding_completed_at,
            coalesce(o.draft, '{}'::jsonb) as draft
     from ax_core.profiles p
     join ax_private.auth_users a on a.id = p.id
     left join ax_private.onboarding_profiles o on o.user_id = p.id
     where p.id = $1
     limit 1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const onboarding = parseOnboarding(row);
  return {
    member: rowToMember(row, onboarding),
    onboardingComplete: row.onboarding_completed_at !== null,
    onboarding,
  };
}

export async function completeOnboarding(
  userId: string,
  role: Exclude<UserRole, "운영자">,
  input: OnboardingFinalizeInput,
): Promise<MaskedMember> {
  await withTransaction(async (client: PoolClient) => {
    const profileUpdate = await client.query(
      `update ax_core.profiles
       set role = $2,
           organization_name = $3,
           organization_type = $4,
           organization_role = $5,
           region_sido = $6,
           region_sigungu = $7,
           field_tag_ids = $8,
           value_chain_stage = $9,
           mission_statement = $10,
           supply_tags = $11::jsonb,
           activities = $12,
           preferred_mode = $13,
           profile_visibility = $14
       where id = $1`,
      [
        userId,
        role,
        input.organization.name,
        input.organization.type,
        input.organization.role,
        input.region.sido,
        input.region.sigungu,
        input.field_tags,
        input.value_chain_stage,
        input.mission_statement,
        JSON.stringify(input.supply_tags),
        input.activities,
        input.preferred_mode,
        input.consents.publish_profile ? "network" : "private",
      ],
    );
    if (profileUpdate.rowCount !== 1) {
      throw new Error("사용자 프로필을 찾을 수 없습니다.");
    }

    await client.query(
      `insert into ax_private.onboarding_profiles
         (user_id, profile_revision, draft, consents, completed_at)
       values ($1, 1, $2::jsonb, $3::jsonb, now())
       on conflict (user_id) do update set
         profile_revision = ax_private.onboarding_profiles.profile_revision + 1,
         draft = excluded.draft,
         consents = excluded.consents,
         completed_at = now()`,
      [userId, JSON.stringify(input), JSON.stringify(input.consents)],
    );
    await client.query(
      `update ax_private.auth_users
       set onboarding_completed_at = coalesce(onboarding_completed_at, now())
       where id = $1 and status = 'active'`,
      [userId],
    );
    await client.query(
      `insert into ax_private.auth_events (auth_user_id, event_type)
       values ($1, 'onboarding_completed')`,
      [userId],
    );
  });

  const member = await getProfileForUser(userId);
  if (!member) throw new Error("저장된 사용자 프로필을 찾을 수 없습니다.");
  return member;
}
