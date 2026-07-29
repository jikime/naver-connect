import "server-only";

import type { DatasetKey } from "@/lib/data/dataset-registry";
import { getDatasetDefinition } from "@/lib/data/dataset-registry";
import { query } from "@/lib/db";

interface DatasetRow {
  document: unknown;
  revision: number;
  updated_at: Date | string;
}

interface PublicProfileRow {
  persona_id: string;
  display_name: string;
  role: "기업가" | "전문가";
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
}

async function mergeDatabaseProfiles(document: unknown): Promise<unknown> {
  if (!Array.isArray(document)) return document;
  const result = await query<PublicProfileRow>(
    `select a.persona_id, p.display_name, p.role, p.organization_name,
            p.organization_type, p.organization_role, p.region_sido,
            p.region_sigungu, p.field_tag_ids, p.value_chain_stage,
            p.mission_statement, p.supply_tags, p.activities,
            p.preferred_mode
     from ax_core.profiles p
     join ax_private.auth_users a on a.id = p.id
     where a.status = 'active'
       and p.role in ('기업가', '전문가')
       and p.profile_visibility in ('network', 'public')`,
  );
  const byId = new Map(
    document
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && "id" in item,
      )
      .map((item) => [String(item.id), item]),
  );
  for (const profile of result.rows) {
    byId.set(profile.persona_id, {
      id: profile.persona_id,
      name: profile.display_name,
      member_type: profile.role,
      expert_subtype: null,
      org: {
        name: profile.organization_name ?? "",
        type: profile.organization_type ?? "",
        role: profile.organization_role ?? "",
      },
      region: {
        sido: profile.region_sido ?? "",
        sigungu: profile.region_sigungu ?? "",
      },
      field_tags: profile.field_tag_ids,
      value_chain_stage: profile.value_chain_stage ?? "",
      mission_statement: profile.mission_statement ?? "",
      trust_connections: [],
      hot_lead: false,
      keyword_set: [],
      affiliation_org_id: null,
      target_org_ids: [],
      visibility: {
        public: {
          supply_tags: profile.supply_tags,
          activities: profile.activities,
          preferred_mode: profile.preferred_mode ?? "",
          region: {
            sido: profile.region_sido ?? "",
            sigungu: profile.region_sigungu ?? "",
          },
        },
      },
    });
  }
  return [...byId.values()];
}

export class DatasetNotFoundError extends Error {
  constructor(key: string) {
    super(`데이터셋을 찾을 수 없습니다: ${key}`);
    this.name = "DatasetNotFoundError";
  }
}

export interface DatasetDocument<T> {
  key: DatasetKey;
  data: T;
  revision: number;
  updatedAt: string;
}

export async function getDatasetDocument<T>(
  key: string,
): Promise<DatasetDocument<T>> {
  const definition = getDatasetDefinition(key);
  if (!definition) throw new DatasetNotFoundError(key);
  const schema = definition.access === "core" ? "ax_core" : "ax_private";
  const result = await query<DatasetRow>(
    `select document, revision, updated_at
     from ${schema}.datasets
     where dataset_key = $1
     limit 1`,
    [definition.key],
  );
  const row = result.rows[0];
  if (!row) throw new DatasetNotFoundError(key);
  const document =
    definition.key === "members"
      ? await mergeDatabaseProfiles(row.document)
      : row.document;
  return {
    key: definition.key,
    data: document as T,
    revision: row.revision,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getServerDataset<T>(key: DatasetKey): Promise<T> {
  return (await getDatasetDocument<T>(key)).data;
}
