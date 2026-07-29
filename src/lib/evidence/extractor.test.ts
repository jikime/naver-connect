// evidence 추출기 유닛 — PII 마스킹 / Need·availability 비추론(타입+런타임) /
// claim 전부 proposed / link 후보 자동 병합 불가(needs_review only) / 결정성.
// 픽스처는 창작 문장(실제 블로그 원문 아님).
// 근거: src/types/evidence.ts 계약, Codex 분담 지시(2026-07-29), 부록 A-1/-3

import { describe, expect, it } from "vitest";
import {
  type ExtractorDictionaries,
  extractPost,
  scrubPii,
} from "@/lib/evidence/extractor";
import {
  buildLinkCandidates,
  renderReviewTable,
} from "@/lib/evidence/link-candidates";
import type { EvidencePostInput } from "@/types/evidence";

const dict: ExtractorDictionaries = {
  organizations: [{ id: "ORG-777", name: "달빛나눔협동조합" }],
  members: [{ id: "M-001", name: "김서연", orgName: "달빛나눔협동조합" }],
  tags: [{ id: 1, name: "고객·기회 발굴" }],
  fields: [{ id: 5, name: "먹거리·농식품" }],
};

const post = (body: string): EvidencePostInput => ({
  post_id: "post-0001",
  url: "https://example.invalid/1",
  title: "테스트 인물 소개",
  category_no: 7,
  body_text: body,
});

describe("scrubPii — 수집 계약 재검증", () => {
  it("전화·이메일이 남아 있으면 마스킹하고 위반 수를 센다", () => {
    const { text, violations } = scrubPii(
      "연락은 010-1234-5678 또는 hello@example.com 으로 주세요.",
    );
    expect(violations).toBe(2);
    expect(text).not.toContain("1234");
    expect(text).not.toContain("@");
  });
});

describe("extractPost — 계약 집행", () => {
  const body =
    "김서연 대표는 달빛나눔협동조합을 이끌며 먹거리·농식품 분야에서 활동한다. " +
    "작년에는 이웃 조직과 공동 프로젝트를 운영해 좋은 반응을 얻었다.";

  it("person/organization/skill/experience 4종만 추출된다 (Need·availability 부재)", () => {
    const r = extractPost(post(body), dict);
    const kinds = new Set(r.mentions.map((m) => m.kind));
    expect([...kinds].sort()).toEqual(
      ["experience", "organization", "person", "skill"].sort(),
    );
    const serialized = JSON.stringify(r);
    expect(serialized).not.toContain('"need"');
    expect(serialized).not.toContain("availability");
  });

  it("모든 claim은 status=proposed이며 evidence_span을 가진다", () => {
    const r = extractPost(post(body), dict);
    expect(r.claims.length).toBeGreaterThan(0);
    for (const c of r.claims) {
      expect(c.status).toBe("proposed");
      expect(c.evidence_span.end).toBeGreaterThan(c.evidence_span.start);
    }
  });

  it("같은 입력에 대해 결정적으로 같은 출력을 낸다", () => {
    expect(JSON.stringify(extractPost(post(body), dict))).toBe(
      JSON.stringify(extractPost(post(body), dict)),
    );
  });
});

describe("buildLinkCandidates — 자동 병합 불가", () => {
  it("이름+소속 동시 일치는 근거 2개가 쌓이지만 status는 needs_review뿐이다", () => {
    const r = extractPost(
      post("김서연 대표는 달빛나눔협동조합에서 일한다."),
      dict,
    );
    const links = buildLinkCandidates(r.mentions, {
      organizations: dict.organizations,
      members: [
        {
          id: "M-001",
          name: "김서연",
          orgName: "달빛나눔협동조합",
          sido: "전북",
          keywords: [],
        },
      ],
    });
    const memberLink = links.find((l) => l.candidate.kind === "member");
    expect(memberLink).toBeDefined();
    expect(memberLink?.match_basis).toContain("exact_name");
    expect(memberLink?.match_basis).toContain("org_name_match");
    expect(links.every((l) => l.status === "needs_review")).toBe(true);
  });

  it("이름 신호가 전혀 없으면 회원 후보를 만들지 않는다 (과잉 후보 방지)", () => {
    const r = extractPost(post("박준호 이사장이 새 사업을 시작했다."), dict);
    const links = buildLinkCandidates(r.mentions, {
      organizations: [],
      members: [
        {
          id: "M-001",
          name: "김서연",
          orgName: "달빛나눔협동조합",
          sido: "전북",
          keywords: [],
        },
      ],
    });
    expect(links.filter((l) => l.candidate.kind === "member")).toHaveLength(0);
  });

  it("검토표 마크다운이 후보 수만큼 행을 만든다", () => {
    const r = extractPost(
      post("김서연 대표는 달빛나눔협동조합에서 일한다."),
      dict,
    );
    const links = buildLinkCandidates(r.mentions, {
      organizations: dict.organizations,
      members: [
        {
          id: "M-001",
          name: "김서연",
          orgName: "달빛나눔협동조합",
          sido: "전북",
          keywords: [],
        },
      ],
    });
    const md = renderReviewTable(links);
    expect(md.split("\n").filter((l) => l.startsWith("|")).length).toBe(
      links.length + 2,
    );
  });
});
