// collaboration-server.ts — Supabase DB 기반 async 함수 (Server Component 전용, v1.3).
// "server-only" 가드: 이 파일을 Client Component에서 import하면 빌드 에러가 발생합니다.
// 근거: ARCHITECTURE.md §5.2, Next.js server-only 패턴

import "server-only";

import { getDatasetDocument } from "@/lib/server/dataset-repository";
import type { CollabCase, CollabRelation, Organization } from "@/types";

/**
 * DB에서 협업사례 조회. 연결·데이터 오류는 호출자에게 그대로 전달한다.
 */
export async function getCollabCasesFromDB(): Promise<CollabCase[]> {
  return (await getDatasetDocument<CollabCase[]>("collab-cases")).data;
}

/**
 * DB에서 협업관계 조회. 필터는 DB 정본을 읽은 뒤 동일한 DTO 규칙으로 적용한다.
 */
export async function getCollabRelationsFromDB(filter?: {
  onlyActual?: boolean;
  minStrength?: number;
}): Promise<CollabRelation[]> {
  const relations = (
    await getDatasetDocument<CollabRelation[]>("collab-relations")
  ).data;
  return relations
    .filter((relation) => !filter?.onlyActual || relation.is_actual)
    .filter(
      (relation) =>
        filter?.minStrength === undefined ||
        relation.strength >= filter.minStrength,
    )
    .sort((a, b) => b.strength - a.strength);
}

/**
 * DB에서 기관 목록 조회.
 */
export async function getOrganizationsFromDB(): Promise<Organization[]> {
  const organizations = (
    await getDatasetDocument<Organization[]>("organizations")
  ).data;
  return [...organizations].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}
