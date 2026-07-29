import "server-only";

import type { UserRole } from "@/lib/auth/types";
import type { DatasetKey } from "@/lib/data/dataset-registry";

interface DatasetViewer {
  role: UserRole;
  personaId: string;
}

export class DatasetAccessDeniedError extends Error {
  constructor(key: DatasetKey) {
    super(`접근할 수 없는 데이터셋입니다: ${key}`);
    this.name = "DatasetAccessDeniedError";
  }
}

function records(document: unknown): Record<string, unknown>[] {
  if (!Array.isArray(document)) return [];
  return document.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object",
  );
}

/**
 * 인증된 브라우저에 내려보낼 수 있는 데이터 범위를 결정한다.
 * 매칭 원문·점수·회원 비공개 원본은 이 API를 통해서는 운영자에게도 제공하지 않는다.
 */
export function scopeDatasetForViewer(
  key: DatasetKey,
  document: unknown,
  viewer: DatasetViewer,
): unknown {
  switch (key) {
    case "member-embedding-shadow":
    case "members-private-redacted":
    case "recommendations-redacted":
      return document;
    case "people-needs":
      if (viewer.role === "운영자") return document;
      return records(document).filter((item) => {
        const owner = item.owner;
        return (
          owner !== null &&
          typeof owner === "object" &&
          "kind" in owner &&
          owner.kind === "person" &&
          "id" in owner &&
          owner.id === viewer.personaId
        );
      });
    case "people-consents":
      if (viewer.role === "운영자") return document;
      return records(document).filter(
        (item) => item.person_id === viewer.personaId,
      );
    case "deal-rooms":
      if (viewer.role === "운영자") return document;
      return records(document).filter((item) => {
        const participants = item.participating_member_ids;
        return (
          item.owner_member_id === viewer.personaId ||
          (Array.isArray(participants) &&
            participants.includes(viewer.personaId))
        );
      });
    case "vocabulary-change-events":
      if (viewer.role === "운영자") return document;
      throw new DatasetAccessDeniedError(key);
    case "match-scores":
    case "members-private":
    case "recommendations-private":
      throw new DatasetAccessDeniedError(key);
    default:
      return document;
  }
}
