// link_candidates — 블로그 멘션 ↔ 기존 조직80/회원8 대조 후보표 생성(순수 함수).
// 자동 병합 금지: 출력 status는 "needs_review" 단일값(타입 강제), 병합 결정은 사람이 한다.
// 이름 exact 일치만으로 회원 후보를 만들되 근거(match_basis)를 전부 남긴다 — 현재 공개 표본과
// seed 8명은 exact match 0으로 확인된 상태(동일인 가정 금지, people_match_retrieval_plan §1.1).
// 근거: Codex 분담 지시(2026-07-29), 부록 A-3(자동 링크 금지)

import type { EntityMention, LinkCandidate } from "@/types/evidence";

export interface LinkDictionaries {
  organizations: { id: string; name: string; region?: { sido?: string } }[];
  members: {
    id: string;
    name: string;
    orgName: string;
    sido: string;
    keywords: string[];
  }[];
}

/** surface에서 호칭/직함 제거 → 이름만 */
function bareName(surface: string): string {
  return surface
    .replace(
      /\s?(님|대표|이사장|센터장|사무국장|국장|팀장|활동가|매니저|코디네이터)$/,
      "",
    )
    .trim();
}

export function buildLinkCandidates(
  mentions: EntityMention[],
  dict: LinkDictionaries,
): LinkCandidate[] {
  const out: LinkCandidate[] = [];
  let seq = 0;

  for (const m of mentions) {
    if (m.kind === "organization" && m.matched_ref?.kind === "organization") {
      const org = dict.organizations.find((o) => o.id === m.matched_ref?.id);
      if (org) {
        out.push({
          id: `link-${m.post_id}-${seq++}`,
          post_id: m.post_id,
          mention_surface: m.surface,
          candidate: { kind: "organization", id: org.id, name: org.name },
          match_basis: ["exact_name"],
          evidence: [`본문에 조직명 정확 일치: "${m.surface}"`],
          score: 0.9,
          status: "needs_review",
        });
      }
      continue;
    }

    if (m.kind !== "person") continue;
    const name = bareName(m.surface);
    if (name.length < 2) continue;

    for (const member of dict.members) {
      const basis: LinkCandidate["match_basis"] = [];
      const evidence: string[] = [];
      let score = 0;

      if (member.name === name) {
        basis.push("exact_name");
        evidence.push(`이름 정확 일치: ${name}`);
        score += 0.5;
      } else if (member.name.includes(name) || name.includes(member.name)) {
        basis.push("partial_name");
        evidence.push(`이름 부분 일치: ${name} ↔ ${member.name}`);
        score += 0.25;
      } else {
        continue; // 이름 신호가 전혀 없으면 후보 생성 안 함(과잉 후보 방지)
      }

      // 같은 글에서 그 회원의 소속 조직이 함께 언급되면 보강 근거
      const orgCoMention = mentions.some(
        (x) =>
          x.post_id === m.post_id &&
          x.kind === "organization" &&
          x.surface === member.orgName,
      );
      if (orgCoMention) {
        basis.push("org_name_match");
        evidence.push(`소속 조직 동시 언급: ${member.orgName}`);
        score += 0.3;
      }

      out.push({
        id: `link-${m.post_id}-${seq++}`,
        post_id: m.post_id,
        mention_surface: m.surface,
        candidate: { kind: "member", id: member.id, name: member.name },
        match_basis: basis,
        evidence,
        score: Math.min(1, score),
        status: "needs_review",
      });
    }
  }

  return out.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

/** 수동 검토용 마크다운 표 */
export function renderReviewTable(candidates: LinkCandidate[]): string {
  const lines = [
    "| score | 멘션 | 후보 | 근거 | post |",
    "|---|---|---|---|---|",
  ];
  for (const c of candidates) {
    lines.push(
      `| ${c.score.toFixed(2)} | ${c.mention_surface} | ${c.candidate.kind}:${c.candidate.name} | ${c.evidence.join("; ")} | ${c.post_id} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}
