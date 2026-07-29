// Meetup — 개설된 모둠 (v1.1 신규 시드, ADR-06 개정: 독립 시드로 확정) [창작 목업]
// 근거: ARCHITECTURE.md §4.2, FR-MG-01, FR-RC-08, FR-GR-06
// 시드: src/data/meetups.json (비민감). recommendations 의 rec_kind='모둠'(REC-05)이 meetup_id 로 참조.

export interface Meetup {
  id: string;
  /** FR-MG-01 필터 */
  type: "학습모임" | "취미모임" | "지역앰배서더" | "공공모둠";
  title: string;
  purpose: string;
  /** FR-MG-01 분야 필터 (비어 있을 수 있음 — 취미모임 등) */
  field_tags: number[];
  region: { sido: string; sigungu: string };
  member_ids: string[];
  host_member_id: string;
  /** 개설 경로 */
  created_source:
    | "격차카드모둠개설"
    | "공공중간지원추천"
    | "자발개설"
    | "AI추천";
  /** AI 추천 모둠에서만 노출하는 구성 근거. */
  recommendation_reason?: string;
  /** AI가 공개 프로필과 구성원 연결도를 바탕으로 호스트를 추천한 근거. */
  host_recommendation_reason?: string;
  /** AI 호스트 적합도(0..100). */
  host_recommendation_score?: number;
}

export interface MeetupAvailabilitySlot {
  date: string;
  time: string;
}

/** 모둠 참여자가 공유한 온라인 첫 미팅 가능 시간. */
export interface MeetupAvailability {
  meetup_id: string;
  member_id: string;
  slots: MeetupAvailabilitySlot[];
}

/** 모둠 참여자끼리 나눈 임시 세션 채팅 메시지. */
export interface MeetupChatMessage {
  id: string;
  meetup_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  sent_at: string;
}
