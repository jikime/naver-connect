// vitest 공용 셋업 — node 테스트에는 HTTP 서버가 없으므로 매칭 클라이언트의 transport를
// 서버 서비스 함수에 직접 연결한다(경계 계약은 동일: MatchingRequest → MatchingBundle,
// SafeTextConfirmRequest → SafeTextConfirmResult[]).
// 근거: C3(codex final-rereview-reject #1), M2 P1-1, src/lib/dal/matching.ts transport 계약

import { beforeEach } from "vitest";
import { setMatchingTransport, setSafeTextTransport } from "@/lib/dal/matching";
import {
  clearRuntimeStateCache,
  type UserRuntimeState,
} from "@/lib/dal/runtime-state";
import {
  DATASET_DEFINITIONS,
  type DatasetKey,
  getDatasetDefinition,
} from "@/lib/data/dataset-registry";
import {
  computeMatchingBundle,
  confirmSafeMatchTexts,
  initializeMatchingData,
} from "@/lib/server/matching-service";
import { initializeVocabulary } from "@/lib/vocabulary";
import type { VocabularyReleaseFile } from "@/types";

const fixtureModules = (
  import.meta as ImportMeta & {
    glob: (
      pattern: string,
      options: { eager: true; import: string },
    ) => Record<string, unknown>;
  }
).glob("../data/**/*.json", {
  eager: true,
  import: "default",
});
const fixtureByDataset = new Map(
  DATASET_DEFINITIONS.filter((definition) =>
    definition.path.endsWith(".json"),
  ).map(
    (definition) =>
      [definition.key, fixtureModules[`../data/${definition.path}`]] as const,
  ),
);

function fixture<T>(key: DatasetKey): T {
  const value = fixtureByDataset.get(key);
  if (value === undefined) throw new Error(`테스트 픽스처가 없습니다: ${key}`);
  return value as T;
}

initializeMatchingData({
  members: fixture("members"),
  scores: fixture("match-scores"),
  recommendations: fixture("recommendations-private"),
  tags: fixture("tags"),
  needs: fixture("people-needs"),
  consents: fixture("people-consents"),
  offers: fixture("capability-offers"),
  impacts: fixture("impact-intents"),
  organizations: fixture("organizations"),
  meetups: fixture("meetups"),
  collabRelations: fixture("collab-relations"),
});
initializeVocabulary(fixture<VocabularyReleaseFile>("vocabulary-role-terms"));
const nativeFetch = globalThis.fetch;
let fixtureRuntimeState: Partial<UserRuntimeState> = {};
globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const match = url.match(/^\/api\/data\/([^/?#]+)/u);
  if (match) {
    const key = decodeURIComponent(match[1]);
    const definition = getDatasetDefinition(key);
    const data = fixtureByDataset.get(definition?.key ?? "fields");
    if (!definition || data === undefined) {
      return Response.json({ message: "fixture not found" }, { status: 404 });
    }
    return Response.json({
      key: definition.key,
      data,
      revision: 1,
      updatedAt: "2026-07-29T00:00:00.000Z",
    });
  }
  if (url === "/api/state") {
    if ((init?.method ?? "GET").toUpperCase() === "PUT") {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        key: keyof UserRuntimeState;
        value: UserRuntimeState[keyof UserRuntimeState];
      };
      fixtureRuntimeState = {
        ...fixtureRuntimeState,
        [body.key]: body.value,
      };
    }
    return Response.json({ state: fixtureRuntimeState, revision: 1 });
  }
  if (!nativeFetch) throw new Error(`테스트 fetch 미구현: ${url}`);
  return nativeFetch(input, init);
};

beforeEach(() => {
  fixtureRuntimeState = {};
  clearRuntimeStateCache();
});

setMatchingTransport(async (req) => computeMatchingBundle(req));
setSafeTextTransport(async (req) => confirmSafeMatchTexts(req));
