// collaboration-server.ts — Supabase DB 기반 async 함수 (Server Component 전용, v1.3).
// "server-only" 가드: 이 파일을 Client Component에서 import하면 빌드 에러가 발생합니다.
// 근거: ARCHITECTURE.md §5.2, Next.js server-only 패턴

import "server-only";

import collabCasesSeed from "@/data/collab_cases.json";
import collabRelationsSeed from "@/data/collab_relations.json";
import organizationsSeed from "@/data/organizations.json";
import type {
  CollabCase,
  CollabRelation,
  Organization,
} from "@/types";

/**
 * DB에서 협업사례 조회. DB 연결 실패 시 JSON 시드로 fallback한다.
 */
export async function getCollabCasesFromDB(): Promise<CollabCase[]> {
  try {
    const { query } = await import("@/lib/db");
    const { rows } = await query<CollabCase>(
      "SELECT id, title, status, participant_org_ids, period, outcome_summary, field_tags, input_by FROM collab_cases ORDER BY created_at DESC",
    );
    return rows.length > 0 ? rows : (collabCasesSeed as CollabCase[]);
  } catch {
    return collabCasesSeed as CollabCase[];
  }
}

/**
 * DB에서 협업관계 조회. DB 연결 실패 시 JSON 시드로 fallback한다.
 */
export async function getCollabRelationsFromDB(filter?: {
  onlyActual?: boolean;
  minStrength?: number;
}): Promise<CollabRelation[]> {
  try {
    const { query } = await import("@/lib/db");
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter?.onlyActual) {
      params.push(true);
      conditions.push(`is_actual = $${params.length}`);
    }
    if (filter?.minStrength !== undefined) {
      params.push(filter.minStrength);
      conditions.push(`strength >= $${params.length}`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await query<CollabRelation>(
      `SELECT id, org_a_id, org_b_id, org_a_subgroup, org_b_subgroup,
              pair_code, relation_type, domain_tags, strength,
              basis_case_id, is_actual, description
       FROM collab_relations ${where} ORDER BY strength DESC`,
      params,
    );
    return rows.length > 0 ? rows : (collabRelationsSeed as CollabRelation[]);
  } catch {
    return collabRelationsSeed as CollabRelation[];
  }
}

/**
 * DB에서 기관 목록 조회. DB 연결 실패 시 JSON 시드로 fallback한다.
 */
export async function getOrganizationsFromDB(): Promise<Organization[]> {
  try {
    const { query } = await import("@/lib/db");
    const { rows } = await query<Organization>(
      `SELECT id, name, region, field_tags, value_chain_stage_id, actor_type,
              ai_confidence, source, verified_by, last_checked_at, member_id,
              buying_power, five_force_role, subgroup_code
       FROM organizations ORDER BY name`,
    );
    return rows.length > 0 ? rows : (organizationsSeed as Organization[]);
  } catch {
    return organizationsSeed as Organization[];
  }
}
