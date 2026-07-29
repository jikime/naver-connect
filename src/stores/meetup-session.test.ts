import { beforeEach, describe, expect, it } from "vitest";
import { useMeetupSessionStore } from "@/stores/meetup-session";
import type { Meetup } from "@/types";

const meetup: Meetup = {
  id: "USER-MU-1",
  type: "학습모임",
  title: "테스트 모둠",
  purpose: "테스트",
  field_tags: [2],
  region: { sido: "서울", sigungu: "은평구" },
  member_ids: ["M-001"],
  host_member_id: "M-001",
  created_source: "자발개설",
};

describe("meetup session store", () => {
  beforeEach(() => {
    useMeetupSessionStore.getState().reset();
  });

  it("adds a meetup and tracks participation without duplicates", () => {
    const store = useMeetupSessionStore.getState();
    store.addMeetup(meetup);
    store.joinMeetup(meetup.id, "M-002");
    store.joinMeetup(meetup.id, "M-002");

    const state = useMeetupSessionStore.getState();
    expect(state.createdMeetups).toEqual([meetup]);
    expect(state.joinedMemberIdsByMeetup[meetup.id]).toEqual(["M-002"]);
  });

  it("shares each member's available slots by meetup", () => {
    useMeetupSessionStore.getState().shareAvailability({
      meetup_id: meetup.id,
      member_id: "M-001",
      slots: [
        { date: "2026-08-01", time: "14:00" },
        { date: "2026-08-01", time: "14:30" },
      ],
    });
    useMeetupSessionStore.getState().shareAvailability({
      meetup_id: meetup.id,
      member_id: "M-002",
      slots: [{ date: "2026-08-01", time: "14:30" }],
    });

    expect(
      useMeetupSessionStore.getState().availabilityByMeetup[meetup.id]["M-001"]
        .slots,
    ).toHaveLength(2);
    expect(
      useMeetupSessionStore.getState().availabilityByMeetup[meetup.id]["M-002"]
        .slots[0].time,
    ).toBe("14:30");

    useMeetupSessionStore.getState().leaveMeetup(meetup.id, "M-002");

    expect(
      useMeetupSessionStore.getState().availabilityByMeetup[meetup.id]["M-002"],
    ).toBeUndefined();
  });

  it("keeps chat messages separated by meetup", () => {
    const store = useMeetupSessionStore.getState();
    store.sendChatMessage({
      id: "CHAT-1",
      meetup_id: meetup.id,
      sender_id: "M-001",
      sender_name: "김서연",
      body: "첫 인사입니다.",
      sent_at: "2026-07-29T08:00:00.000Z",
    });
    store.sendChatMessage({
      id: "CHAT-2",
      meetup_id: "USER-MU-2",
      sender_id: "M-002",
      sender_name: "박준호",
      body: "다른 모둠 메시지입니다.",
      sent_at: "2026-07-29T08:01:00.000Z",
    });

    const state = useMeetupSessionStore.getState();
    expect(state.chatMessagesByMeetup[meetup.id]).toHaveLength(1);
    expect(state.chatMessagesByMeetup[meetup.id][0].body).toBe(
      "첫 인사입니다.",
    );
    expect(state.chatMessagesByMeetup["USER-MU-2"]).toHaveLength(1);
  });
});
