// evidence 추출기 v0 — 룰 기반(사전 대조 + 패턴). LLM 추출기는 M2에서 같은 계약으로 교체된다.
// 순수 함수: 사전(orgs/tags/fields/members)을 주입받아 글 1건 → mentions + proposed claims.
// PII 안전장치: 본문에 전화/이메일 패턴이 남아 있으면 추출 전에 마스킹하고 위반으로 보고한다.
// 근거: src/types/evidence.ts 계약, people_match_retrieval_plan.md §3.2

import type {
  EntityMention,
  EvidencePostInput,
  ProfileClaim,
} from "@/types/evidence";

export const EXTRACTOR = { name: "rule-baseline", version: "0.1.0" } as const;

export interface ExtractorDictionaries {
  organizations: { id: string; name: string }[];
  members: { id: string; name: string; orgName: string }[];
  tags: { id: number; name: string }[];
  fields: { id: number; name: string }[];
}

export interface ExtractionResult {
  post_id: string;
  mentions: EntityMention[];
  claims: ProfileClaim[];
  pii_violations: number;
}

const PHONE_RE = /0\d{1,2}[)-\s.]?\d{3,4}[-\s.]?\d{4}/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
/** 사람 표기: 2~4자 한글 이름 + 직함/호칭 */
const PERSON_RE =
  /([가-힣]{2,4})\s?(님|대표|이사장|센터장|사무국장|국장|팀장|활동가|매니저|코디네이터)/g;

/** 전화·이메일이 남아 있으면 마스킹(수집기 계약 위반 카운트) */
export function scrubPii(body: string): { text: string; violations: number } {
  let violations = 0;
  const text = body
    .replace(PHONE_RE, () => {
      violations += 1;
      return "[연락처 삭제]";
    })
    .replace(EMAIL_RE, () => {
      violations += 1;
      return "[이메일 삭제]";
    });
  return { text, violations };
}

function* indexesOf(haystack: string, needle: string): Generator<number> {
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    yield idx;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
}

/** 글 1건 추출 — 결정적(같은 입력=같은 출력, id는 post_id+종류+순번) */
export function extractPost(
  post: EvidencePostInput,
  dict: ExtractorDictionaries,
): ExtractionResult {
  const { text, violations } = scrubPii(post.body_text);
  const mentions: EntityMention[] = [];
  const claims: ProfileClaim[] = [];
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${post.post_id}-${seq++}`;

  // 조직 멘션 — 사전 exact 대조(이름 4자 이상만: 2~3자 조직명 오탐 방지)
  for (const org of dict.organizations) {
    if (org.name.length < 4) continue;
    for (const start of indexesOf(text, org.name)) {
      mentions.push({
        id: nextId("men"),
        post_id: post.post_id,
        kind: "organization",
        surface: org.name,
        span: { start, end: start + org.name.length },
        matched_ref: { kind: "organization", id: org.id },
        confidence: 0.9,
        extractor: EXTRACTOR,
      });
      break; // 글당 조직 1회면 후보 대조에 충분
    }
  }

  // 스킬/분야 멘션 — tags·fields 사전
  for (const t of dict.tags) {
    const start = text.indexOf(t.name);
    if (start !== -1) {
      mentions.push({
        id: nextId("men"),
        post_id: post.post_id,
        kind: "skill",
        surface: t.name,
        span: { start, end: start + t.name.length },
        matched_ref: { kind: "tag", id: String(t.id) },
        confidence: 0.7,
        extractor: EXTRACTOR,
      });
    }
  }
  for (const f of dict.fields) {
    const start = text.indexOf(f.name);
    if (start !== -1) {
      mentions.push({
        id: nextId("men"),
        post_id: post.post_id,
        kind: "skill",
        surface: f.name,
        span: { start, end: start + f.name.length },
        matched_ref: { kind: "field", id: String(f.id) },
        confidence: 0.6,
        extractor: EXTRACTOR,
      });
    }
  }

  // 사람 멘션 + role claim(proposed)
  const seenPersons = new Set<string>();
  for (const m of text.matchAll(PERSON_RE)) {
    const [surfaceFull, name, title] = m;
    if (seenPersons.has(surfaceFull)) continue;
    seenPersons.add(surfaceFull);
    const start = m.index ?? 0;
    mentions.push({
      id: nextId("men"),
      post_id: post.post_id,
      kind: "person",
      surface: surfaceFull,
      span: { start, end: start + surfaceFull.length },
      confidence: 0.6,
      extractor: EXTRACTOR,
    });
    if (title !== "님") {
      claims.push({
        id: nextId("clm"),
        post_id: post.post_id,
        subject_surface: name,
        claim_kind: "role",
        value: title,
        evidence_span: { start, end: start + surfaceFull.length },
        status: "proposed",
        extractor: EXTRACTOR,
      });
    }
  }

  // 경험 멘션 — 협업 신호 어휘가 있는 문장(문장 단위 span)
  const EXP_HINTS = ["협업", "함께 진행", "공동", "프로젝트", "운영해"];
  let cursor = 0;
  for (const sentence of text.split(/(?<=[.!?다요])\s+/)) {
    const start = text.indexOf(sentence, cursor);
    cursor = start + sentence.length;
    if (sentence.length < 12) continue;
    if (EXP_HINTS.some((h) => sentence.includes(h))) {
      mentions.push({
        id: nextId("men"),
        post_id: post.post_id,
        kind: "experience",
        surface: sentence.trim().slice(0, 120),
        span: { start, end: start + sentence.length },
        confidence: 0.5,
        extractor: EXTRACTOR,
      });
      claims.push({
        id: nextId("clm"),
        post_id: post.post_id,
        subject_surface: post.title,
        claim_kind: "experience",
        value: sentence.trim().slice(0, 120),
        evidence_span: { start, end: start + sentence.length },
        status: "proposed",
        extractor: EXTRACTOR,
      });
    }
  }

  return { post_id: post.post_id, mentions, claims, pii_violations: violations };
}
