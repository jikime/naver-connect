// 모둠 임시 세션 — 회원 개설, 실제 참여, 온라인 첫 미팅 가능 시간 공유.
// 백엔드 연결 전 프로토타입용이며 새로고침하면 초기화된다.

import { create } from "zustand";
import type { Meetup, MeetupAvailability, MeetupChatMessage } from "@/types";

interface MeetupSessionStore {
  createdMeetups: Meetup[];
  joinedMemberIdsByMeetup: Record<string, string[]>;
  availabilityByMeetup: Record<string, Record<string, MeetupAvailability>>;
  chatMessagesByMeetup: Record<string, MeetupChatMessage[]>;
  addMeetup: (meetup: Meetup) => void;
  joinMeetup: (meetupId: string, memberId: string) => void;
  leaveMeetup: (meetupId: string, memberId: string) => void;
  shareAvailability: (availability: MeetupAvailability) => void;
  sendChatMessage: (message: MeetupChatMessage) => void;
  reset: () => void;
}

const INITIAL_STATE: Pick<
  MeetupSessionStore,
  | "createdMeetups"
  | "joinedMemberIdsByMeetup"
  | "availabilityByMeetup"
  | "chatMessagesByMeetup"
> = {
  createdMeetups: [],
  joinedMemberIdsByMeetup: {},
  availabilityByMeetup: {},
  chatMessagesByMeetup: {},
};

export const useMeetupSessionStore = create<MeetupSessionStore>((set) => ({
  ...INITIAL_STATE,
  addMeetup: (meetup) =>
    set((state) => ({
      createdMeetups: [meetup, ...state.createdMeetups],
    })),
  joinMeetup: (meetupId, memberId) =>
    set((state) => {
      const joined = state.joinedMemberIdsByMeetup[meetupId] ?? [];
      if (joined.includes(memberId)) return state;
      return {
        joinedMemberIdsByMeetup: {
          ...state.joinedMemberIdsByMeetup,
          [meetupId]: [...joined, memberId],
        },
      };
    }),
  leaveMeetup: (meetupId, memberId) =>
    set((state) => {
      const meetupAvailability = {
        ...(state.availabilityByMeetup[meetupId] ?? {}),
      };
      delete meetupAvailability[memberId];
      return {
        joinedMemberIdsByMeetup: {
          ...state.joinedMemberIdsByMeetup,
          [meetupId]: (state.joinedMemberIdsByMeetup[meetupId] ?? []).filter(
            (id) => id !== memberId,
          ),
        },
        availabilityByMeetup: {
          ...state.availabilityByMeetup,
          [meetupId]: meetupAvailability,
        },
      };
    }),
  shareAvailability: (availability) =>
    set((state) => ({
      availabilityByMeetup: {
        ...state.availabilityByMeetup,
        [availability.meetup_id]: {
          ...(state.availabilityByMeetup[availability.meetup_id] ?? {}),
          [availability.member_id]: availability,
        },
      },
    })),
  sendChatMessage: (message) =>
    set((state) => ({
      chatMessagesByMeetup: {
        ...state.chatMessagesByMeetup,
        [message.meetup_id]: [
          ...(state.chatMessagesByMeetup[message.meetup_id] ?? []),
          message,
        ],
      },
    })),
  reset: () => set(INITIAL_STATE),
}));
