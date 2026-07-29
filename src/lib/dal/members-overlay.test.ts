// 온보딩 스냅샷 overlay 계약 — 온보딩에서 고친 프로필이 회원 조회·매칭 컨텍스트에 반영되는지.
// 근거: 재리뷰 REJECT #5(overlay) — 스냅샷이 store에만 남고 getMember/personContext/
// impactIntent는 옛 시드로 돌던 문제(C2). 공개 노출 동의(A) 미동의 시 공개층 미적용도 함께 고정한다.

import { beforeEach, describe, expect, it } from "vitest";
import membersSeed from "@/data/members.json";
import { runMatchingEngine } from "@/lib/dal/matching";
import { useSessionInteractionStore } from "@/stores/session-interaction";
import type {
  MemberPublicSeed,
  OnboardingFinalizeInput,
  ViewerContext,
} from "@/types";
import { getMember, searchMembers } from "./members";

const seedMembers = membersSeed as MemberPublicSeed[];
const seedM001 = seedMembers.find((m) => m.id === "M-001") as MemberPublicSeed;
const seedM002 = seedMembers.find((m) => m.id === "M-002") as MemberPublicSeed;

const OPERATOR: ViewerContext = { role: "운영자", personaId: "M-001" };

/** 스냅샷 픽스처 — 시드와 확실히 다른 값으로 채워 overlay 여부를 관찰 가능하게 한다. */
function snapshotFixture(
  over: Partial<OnboardingFinalizeInput> = {},
): OnboardingFinalizeInput {
  return {
    organization: {
      name: "성동 돌봄전환 사회적협동조합",
      type: "사회적기업",
      role: "이사장",
    },
    region: { sido: "부산", sigungu: "해운대구" },
    field_tags: [7, 9],
    value_chain_stage: "확장",
    mission_statement: "돌봄 종사자 처우를 데이터로 바꾼다",
    demand_tags: [
      { tagId: 4, priority: true, detail_quote: "데이터 분석 파트너가 필요" },
    ],
    supply_tags: [{ tagId: 10, detail: "돌봄 종사자 실태조사 원자료" }],
    activities: ["정책연구", "공동사업협업"],
    availability: "월 1회",
    preferred_mode: "온라인 선호",
    participation_scope: "소속 기관을 대표해 참여",
    hot_lead: {
      flag: true,
      project_summary: "종사자 처우 대시보드",
      needed_partner: "데이터 엔지니어",
      stage: "기획",
    },
    readiness: "바로 시작 가능해요",
    trust_connections: [],
    consents: {
      publish_profile: true,
      use_private_needs_for_matching: true,
      quote_in_intro: false,
    },
    visibility_consent: true,
    ...over,
  };
}

function storeSnapshot(personaId: string, snapshot: OnboardingFinalizeInput) {
  useSessionInteractionStore.getState().storeOnboardingResult(personaId, {
    snapshot,
    needs: [],
    offers: [],
    consents: {
      publish: snapshot.consents.publish_profile,
      matching: snapshot.consents.use_private_needs_for_matching,
      quote: snapshot.consents.quote_in_intro,
    },
  });
}

beforeEach(() => {
  useSessionInteractionStore.getState().reset();
});

describe("getMember — 세션 스냅샷 overlay", () => {
  it("온보딩을 확정한 회원은 스냅샷의 조직명·지역·미션·분야로 덮여 조회된다", async () => {
    const snapshot = snapshotFixture();
    storeSnapshot("M-001", snapshot);

    const member = await getMember(OPERATOR, "M-001");
    expect(member.org).toEqual(snapshot.organization);
    expect(member.region).toEqual(snapshot.region);
    expect(member.mission_statement).toBe(snapshot.mission_statement);
    expect(member.field_tags).toEqual(snapshot.field_tags);
    expect(member.value_chain_stage).toBe(snapshot.value_chain_stage);
    // 시드 값이 그대로 남아 있지 않은지도 확인(픽스처가 시드와 같아 통과하는 위양성 차단)
    expect(member.org.name).not.toBe(seedM001.org.name);
    expect(member.region.sigungu).not.toBe(seedM001.region.sigungu);
  });

  it("공개층(supply_tags·activities·preferred_mode·region)도 스냅샷 값으로 덮인다", async () => {
    const snapshot = snapshotFixture();
    storeSnapshot("M-001", snapshot);

    const member = await getMember(OPERATOR, "M-001");
    expect(member.visibility.public.supply_tags).toEqual(snapshot.supply_tags);
    expect(member.visibility.public.activities).toEqual(snapshot.activities);
    expect(member.visibility.public.preferred_mode).toBe(
      snapshot.preferred_mode,
    );
    expect(member.visibility.public.region).toEqual(snapshot.region);
  });

  it("스냅샷이 없는 다른 회원은 시드 값 그대로 불변이다", async () => {
    storeSnapshot("M-001", snapshotFixture());

    const other = await getMember(OPERATOR, "M-002");
    expect(other.org).toEqual(seedM002.org);
    expect(other.region).toEqual(seedM002.region);
    expect(other.mission_statement).toBe(seedM002.mission_statement);
    expect(other.field_tags).toEqual(seedM002.field_tags);
    expect(other.visibility.public.activities).toEqual(
      seedM002.visibility.public.activities,
    );
  });

  it("공개 노출 동의(publish_profile=false)면 공개층 overlay를 적용하지 않고 시드를 유지한다", async () => {
    storeSnapshot(
      "M-001",
      snapshotFixture({
        consents: {
          publish_profile: false,
          use_private_needs_for_matching: true,
          quote_in_intro: false,
        },
        visibility_consent: false,
      }),
    );

    const member = await getMember(OPERATOR, "M-001");
    expect(member.org).toEqual(seedM001.org);
    expect(member.region).toEqual(seedM001.region);
    expect(member.mission_statement).toBe(seedM001.mission_statement);
    expect(member.field_tags).toEqual(seedM001.field_tags);
    expect(member.visibility.public.preferred_mode).toBe(
      seedM001.visibility.public.preferred_mode,
    );
  });
});

describe("searchMembers — overlay된 값 기준 검색", () => {
  it("온보딩에서 바꾼 조직명으로 검색하면 해당 회원이 잡힌다", async () => {
    const snapshot = snapshotFixture();
    storeSnapshot("M-001", snapshot);

    const hits = await searchMembers(OPERATOR, "성동 돌봄전환");
    expect(hits.map((m) => m.id)).toContain("M-001");
  });

  it("바뀌기 전 시드 조직명으로는 더 이상 잡히지 않는다", async () => {
    storeSnapshot("M-001", snapshotFixture());

    const stale = await searchMembers(OPERATOR, seedM001.org.name);
    expect(stale.map((m) => m.id)).not.toContain("M-001");
  });
});

describe("runMatchingEngine — 세션 스냅샷이 매칭 컨텍스트에 반영", () => {
  it("personContext의 region·fieldIds·hotLead가 스냅샷 값을 따른다(keywords는 시드 유지)", () => {
    const snapshot = snapshotFixture();
    storeSnapshot("M-001", snapshot);

    const { input } = runMatchingEngine();
    const ctx = input.personContext["M-001"];
    expect(ctx.region).toEqual(snapshot.region);
    expect(ctx.fieldIds).toEqual(snapshot.field_tags);
    expect(ctx.hotLead).toBe(true);
    expect(ctx.keywords).toEqual(seedM001.keyword_set);
    // 스냅샷이 없는 회원은 시드 컨텍스트 유지
    expect(input.personContext["M-002"].region).toEqual({
      sido: seedM002.region.sido,
      sigungu: seedM002.region.sigungu,
    });
  });

  it("impactIntents가 세션 버전(미션·분야·지역)으로 대체되고 시드 intent는 빠진다", () => {
    const snapshot = snapshotFixture();
    storeSnapshot("M-001", snapshot);

    const { input } = runMatchingEngine();
    const mine = input.impactIntents.filter((i) => i.owner.id === "M-001");
    expect(mine).toHaveLength(1);
    expect(mine[0].id).toBe("impact-session-M-001");
    expect(mine[0].source).toBe("onboarding");
    expect(mine[0].change_statement).toBe(snapshot.mission_statement);
    expect(mine[0].field_ids).toEqual(snapshot.field_tags);
    expect(mine[0].geography).toEqual(snapshot.region);
    // 다른 회원의 시드 intent는 그대로 남는다
    expect(input.impactIntents.some((i) => i.id === "impact-M-002")).toBe(true);
  });
});
