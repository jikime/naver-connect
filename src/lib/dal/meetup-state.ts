import {
  hydrateRuntimeState,
  setRuntimeStateValue,
} from "@/lib/dal/runtime-state";
import type { Meetup, MeetupAvailability, MeetupChatMessage } from "@/types";

export async function createMeetup(meetup: Meetup): Promise<void> {
  const state = await hydrateRuntimeState();
  await setRuntimeStateValue("createdMeetups", [
    meetup,
    ...state.createdMeetups,
  ]);
}

export async function joinMeetup(
  meetupId: string,
  memberId: string,
): Promise<void> {
  const state = await hydrateRuntimeState();
  const joined = state.joinedMemberIdsByMeetup[meetupId] ?? [];
  if (joined.includes(memberId)) return;
  await setRuntimeStateValue("joinedMemberIdsByMeetup", {
    ...state.joinedMemberIdsByMeetup,
    [meetupId]: [...joined, memberId],
  });
}

export async function leaveMeetup(
  meetupId: string,
  memberId: string,
): Promise<void> {
  const state = await hydrateRuntimeState();
  const meetupAvailability = {
    ...(state.availabilityByMeetup[meetupId] ?? {}),
  };
  delete meetupAvailability[memberId];
  await setRuntimeStateValue("joinedMemberIdsByMeetup", {
    ...state.joinedMemberIdsByMeetup,
    [meetupId]: (state.joinedMemberIdsByMeetup[meetupId] ?? []).filter(
      (id) => id !== memberId,
    ),
  });
  await setRuntimeStateValue("availabilityByMeetup", {
    ...state.availabilityByMeetup,
    [meetupId]: meetupAvailability,
  });
}

export async function saveMeetupAvailability(
  availability: MeetupAvailability,
): Promise<void> {
  const state = await hydrateRuntimeState();
  await setRuntimeStateValue("availabilityByMeetup", {
    ...state.availabilityByMeetup,
    [availability.meetup_id]: {
      ...(state.availabilityByMeetup[availability.meetup_id] ?? {}),
      [availability.member_id]: availability,
    },
  });
}

export async function saveMeetupChatMessage(
  message: MeetupChatMessage,
): Promise<void> {
  const state = await hydrateRuntimeState();
  await setRuntimeStateValue("chatMessagesByMeetup", {
    ...state.chatMessagesByMeetup,
    [message.meetup_id]: [
      ...(state.chatMessagesByMeetup[message.meetup_id] ?? []),
      message,
    ],
  });
}
