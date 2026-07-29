import { describe, expect, it } from "vitest";
import {
  DatasetAccessDeniedError,
  scopeDatasetForViewer,
} from "./dataset-access";

const MEMBER = { role: "기업가", personaId: "M-001" } as const;
const OPERATOR = { role: "운영자", personaId: "OPERATOR" } as const;

describe("scopeDatasetForViewer", () => {
  it("공개 데이터셋은 인증 사용자에게 그대로 제공한다", () => {
    const fields = [{ id: 1, name: "돌봄" }];
    expect(scopeDatasetForViewer("fields", fields, MEMBER)).toBe(fields);
  });

  it("비공개 요구와 동의는 본인 행만 제공한다", () => {
    const needs = [
      { id: "N-1", owner: { kind: "person", id: "M-001" } },
      { id: "N-2", owner: { kind: "person", id: "M-002" } },
    ];
    const consents = [
      { id: "C-1", person_id: "M-001" },
      { id: "C-2", person_id: "M-002" },
    ];
    expect(scopeDatasetForViewer("people-needs", needs, MEMBER)).toEqual([
      needs[0],
    ]);
    expect(scopeDatasetForViewer("people-consents", consents, MEMBER)).toEqual([
      consents[0],
    ]);
  });

  it("회원에게는 자신이 소유하거나 참여한 딜만 제공한다", () => {
    const deals = [
      {
        id: "DR-1",
        owner_member_id: "M-001",
        participating_member_ids: [],
      },
      {
        id: "DR-2",
        owner_member_id: "M-002",
        participating_member_ids: ["M-001"],
      },
      {
        id: "DR-3",
        owner_member_id: "M-003",
        participating_member_ids: [],
      },
    ];
    expect(scopeDatasetForViewer("deal-rooms", deals, MEMBER)).toEqual([
      deals[0],
      deals[1],
    ]);
  });

  it("운영자는 요구·동의·딜 전건을 확인할 수 있다", () => {
    const rows = [{ id: "ROW-1" }, { id: "ROW-2" }];
    expect(scopeDatasetForViewer("people-needs", rows, OPERATOR)).toBe(rows);
    expect(scopeDatasetForViewer("people-consents", rows, OPERATOR)).toBe(rows);
    expect(scopeDatasetForViewer("deal-rooms", rows, OPERATOR)).toBe(rows);
  });

  it("매칭 원문·점수·회원 비공개 원본은 공용 API 접근을 거부한다", () => {
    for (const key of [
      "match-scores",
      "members-private",
      "recommendations-private",
    ] as const) {
      expect(() => scopeDatasetForViewer(key, [], OPERATOR)).toThrow(
        DatasetAccessDeniedError,
      );
    }
  });
});
