// DAL: 모듬(Meetup) read — 개설된 모듬 목록·검색 + 단건 조회.
// 근거: ARCHITECTURE.md §4.2/§4.3(설계 노트 B, ADR-06 v1.1 개정)·§5.2, TASKS v1.1, FR-MG-01
// 시드: src/data/meetups.json (비민감 — visibility/demand_tags 없음, RSC/Client 직접 참조 가능하나
//       FR-DA-01 원칙에 따라 화면은 DAL 경유로만 읽는다). [창작 목업]

import meetupsSeed from "@/data/meetups.json";
import type { Meetup, ViewerContext } from "@/types";

const seed = meetupsSeed as Meetup[];

/** id → Meetup 조회 맵. recommendations.ts(모듬 변형 meetup_id 참조)가 재사용한다. */
export const meetupsById = new Map<string, Meetup>(
  seed.map((meetup) => [meetup.id, meetup]),
);

export interface MeetupFilter {
  type?: Meetup["type"];
  fieldId?: number;
  sido?: string;
  /** 제목·목적 키워드 검색 */
  query?: string;
}

/** 개설된 모듬 목록(FR-MG-01). 유형·분야·지역·키워드로 필터링한다. */
export async function getMeetups(
  _vc: ViewerContext,
  filter?: MeetupFilter,
): Promise<Meetup[]> {
  return seed.filter((meetup) => {
    if (filter?.type && meetup.type !== filter.type) return false;
    if (filter?.fieldId && !meetup.field_tags.includes(filter.fieldId)) {
      return false;
    }
    if (filter?.sido && meetup.region.sido !== filter.sido) return false;
    if (filter?.query) {
      const q = filter.query.trim().toLowerCase();
      if (
        q.length > 0 &&
        !`${meetup.title} ${meetup.purpose}`.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });
}

/** 모듬 단건 조회(추천 상세/모듬 카드가 meetup_id로 참조, ADR-06 v1.1). 없으면 reject. */
export async function getMeetup(
  _vc: ViewerContext,
  id: string,
): Promise<Meetup> {
  const meetup = meetupsById.get(id);
  if (!meetup) {
    throw new Error(`Meetup not found: ${id}`);
  }
  return meetup;
}
