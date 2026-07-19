// 딜룸/백오피스 DAL 회귀 테스트. FR-DR-05("내 딜" 우선 정렬 + 딜소싱 세션 반영)와
// FR-BO-06(맞춤 전문기관 매칭)의 핵심 동작을 검증한다.
// 근거: ARCHITECTURE.md §5.2/§5.3, PRD.md v1.1 §8.7/§8.8, TASKS.md 승계 T-020/T-021

import { beforeEach, describe, expect, it } from "vitest";
import { getDealRooms, getExpertMatches, registerDeal } from "@/lib/dal/deal";
import { useSessionInteractionStore } from "@/stores/session-interaction";

beforeEach(() => {
  useSessionInteractionStore.getState().reset();
});

describe("registerDeal → getDealRooms (딜소싱 등록 → 딜룸 반영, FR-DS-01/02·FR-DR-05)", () => {
  it("등록된 딜은 씨앗 단계·source_type '딜소싱'으로 즉시 딜룸 파이프라인에 나타난다", async () => {
    const vc = { role: "기업가" as const, personaId: "M-003" };

    const registered = await registerDeal(vc, {
      title: "로컬푸드 디지털전환 딜소싱 검증",
      hasPolicyProgram: true,
      participantMemberIds: ["M-004"],
      businessContent: "검증용 사업내용",
      expectedEffect: "검증용 기대효과",
    });

    expect(registered.stage).toBe("씨앗");
    expect(registered.source_type).toBe("딜소싱");
    expect(registered.owner_member_id).toBe("M-003");
    expect(registered.participating_member_ids).toEqual(
      expect.arrayContaining(["M-003", "M-004"]),
    );

    const rooms = await getDealRooms(vc);
    expect(rooms.find((r) => r.id === registered.id)).toBeDefined();
  });

  it("등록자 본인 뷰에서는 owner 딜이 다른 딜보다 우선 정렬된다(FR-DR-05)", async () => {
    // M-003(이하나)은 시드 DR-01~05 어디에도 owner/participating으로 얽혀 있지 않으므로
    // 등록 직후 유일한 rank-0(owner) 항목이 되어 정렬 우선순위를 명확히 검증할 수 있다.
    const vc = { role: "기업가" as const, personaId: "M-003" };
    const registered = await registerDeal(vc, {
      title: "정렬 검증 딜",
      hasPolicyProgram: false,
      participantMemberIds: [],
      businessContent: "정렬 검증용 사업내용",
      expectedEffect: "정렬 검증용 기대효과",
    });

    const rooms = await getDealRooms(vc);
    expect(rooms[0].id).toBe(registered.id);
  });

  it("다른 뷰어의 owner 딜이 세션 등록분보다 우선한다(rank는 session-tiebreak보다 상위)", async () => {
    const owner = { role: "기업가" as const, personaId: "M-003" };
    const registered = await registerDeal(owner, {
      title: "타 뷰어 검증 딜",
      hasPolicyProgram: false,
      participantMemberIds: [],
      businessContent: "타 뷰어 검증용 사업내용",
      expectedEffect: "타 뷰어 검증용 기대효과",
    });

    // M-002는 시드 DR-01·DR-04의 owner다(rank 0). 세션 등록분(registered)은 M-002 기준
    // rank 2(무관)라, "동순위 내 세션분 우선" 규칙이 있어도 M-002 자신의 owner 딜을
    // 앞지르지는 못해야 한다 — rank가 session-tiebreak보다 우선한다.
    const otherOwnerViewer = { role: "기업가" as const, personaId: "M-002" };
    const rooms = await getDealRooms(otherOwnerViewer);
    expect(rooms.find((r) => r.id === registered.id)).toBeDefined();
    expect(["DR-01", "DR-04"]).toContain(rooms[0].id);
  });
});

describe("getExpertMatches (등록된 딜에 맞춤 전문기관 추천, FR-BO-06)", () => {
  it("모든 딜에 회계세무 전문가를 포함한다", async () => {
    const vc = { role: "기업가" as const, personaId: "M-001" };
    // DR-01은 시드 고정 딜(핫리드 유입) — 정책/컨소시엄 성격이 아니라도 회계세무는 보편 매칭.
    const matches = await getExpertMatches(vc, "DR-01");
    expect(matches.some((m) => m.category === "회계세무")).toBe(true);
  });

  it("외부공고·공고역방향·딜소싱 등 정책 성격 유입은 기획(제안서) 자문도 함께 매칭한다", async () => {
    const vc = { role: "기업가" as const, personaId: "M-004" };
    // DR-03(외부공고 유입)은 정책사업 성격이라 기획 카테고리도 매칭되어야 한다.
    const matches = await getExpertMatches(vc, "DR-03");
    expect(matches.some((m) => m.category === "기획")).toBe(true);
  });

  it("존재하지 않는 딜 id는 빈 배열을 반환한다", async () => {
    const vc = { role: "기업가" as const, personaId: "M-001" };
    const matches = await getExpertMatches(vc, "DR-NOT-EXIST");
    expect(matches).toEqual([]);
  });
});
