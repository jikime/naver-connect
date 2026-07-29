import type { RuntimeStateKey } from "@/lib/server/runtime-state-repository";
import {
  type BusinessRelationSnapshot,
  useBusinessRelationSessionStore,
} from "@/stores/business-relation-session";
import {
  type MeetupSessionSnapshot,
  useMeetupSessionStore,
} from "@/stores/meetup-session";
import {
  type SessionInteractionSnapshot,
  useSessionInteractionStore,
} from "@/stores/session-interaction";

export interface RecentGalaxyNode {
  id: string;
  label: string;
  classKey: string;
  classLabel: string;
}

export type UserRuntimeState = SessionInteractionSnapshot &
  BusinessRelationSnapshot &
  MeetupSessionSnapshot & {
    recentGalaxyNodes: RecentGalaxyNode[];
  };

const EMPTY_STATE: UserRuntimeState = {
  recommendationOverrides: {},
  onboardingFinalized: {},
  ruleWeightOverrides: null,
  registeredDeals: [],
  onboardingResults: {},
  memberEmbeddingShadows: {},
  myOrgsOverrides: {},
  addedCollabCases: [],
  proposalStatusOverrides: {},
  recentGalaxyNodes: [],
  createdMeetups: [],
  joinedMemberIdsByMeetup: {},
  availabilityByMeetup: {},
  chatMessagesByMeetup: {},
};

interface RuntimeStateResponse {
  state: Partial<UserRuntimeState>;
  revision: number;
}

let statePromise: Promise<UserRuntimeState> | null = null;

function normalizeRuntimeState(
  state: Partial<UserRuntimeState> | undefined,
): UserRuntimeState {
  return { ...EMPTY_STATE, ...(state ?? {}) };
}

function applyRuntimeState(state: UserRuntimeState): void {
  useSessionInteractionStore.getState().hydrate(state);
  useBusinessRelationSessionStore.getState().hydrate(state);
  useMeetupSessionStore.getState().hydrate(state);
}

export async function hydrateRuntimeState(
  force = false,
): Promise<UserRuntimeState> {
  if (force) statePromise = null;
  if (!statePromise) {
    statePromise = fetch("/api/state", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`사용자 상태 조회 실패 (${response.status})`);
        }
        const body = (await response.json()) as RuntimeStateResponse;
        const state = normalizeRuntimeState(body.state);
        applyRuntimeState(state);
        return state;
      })
      .catch((error) => {
        statePromise = null;
        throw error;
      });
  }
  return statePromise;
}

export async function setRuntimeStateValue<K extends RuntimeStateKey>(
  key: K,
  value: UserRuntimeState[K],
): Promise<UserRuntimeState> {
  const response = await fetch("/api/state", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      body?.message ?? `사용자 상태 저장 실패 (${response.status})`,
    );
  }
  const body = (await response.json()) as RuntimeStateResponse;
  const state = normalizeRuntimeState(body.state);
  statePromise = Promise.resolve(state);
  applyRuntimeState(state);
  return state;
}

export function clearRuntimeStateCache(): void {
  statePromise = null;
  applyRuntimeState(EMPTY_STATE);
}
