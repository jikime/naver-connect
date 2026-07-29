---
schema_version: shuzzi-md/v1
doc_kind: narrative_note
project_slug: hackathon-naverconnect
created_at: 2026-07-29T11:53:49+09:00
updated_at: 2026-07-29T14:08:00+09:00
timezone: Asia/Seoul
status: read_first
---

# People matching: read this before continuing

This is the current product and engineering direction for work continued from
`main` or another branch. Treat it as a decision register, not as a claim that
production data, production authentication, or recommendation quality already
exists.

## 1. Product goal

The primary object is a relationship between two people.

> Within the first three recommendations, create at least one connection that
> both people want to accept and that can become a conversation or
> collaboration.

The user interface may explain a relationship with an activity, shared impact
intent, organization path, need, offer, or evidence. Those are supporting
signals. They must not appear as peer nodes in the main relationship map.

- Graph nodes: people only
- Graph edges: reciprocal recommendation potential, existing relationship, or
  operator-reviewed potential relationship
- Edge detail: the concrete activity/topic, `A need → B offer`,
  `B need → A offer`, organization path, and provenance
- Hidden internal objects: match documents, embedding chunks, taxonomy nodes,
  model vectors, and private source text

Do not turn the product into a document-to-document embedding explorer.

## 2. Current data is a demo baseline

The current app is a local demo, not production authentication.

- Demo founder-like account resolves to persona `M-001`.
- Demo expert-like account resolves to persona `M-005`.
- New sign-ups currently alias to one of those seed personas.
- Login and onboarding completion live in browser local storage.
- Profiles and recommendations come from JSON seeds and session overrides.
- Existing authored recommendations are regression fixtures, not ground truth.

Make the mode explicit:

```text
APP_MODE=demo|pilot
DATA_SOURCE=json|db
```

`demo` may use seed personas. `pilot` must use server authentication, RLS, and
an explicit `auth_user_id ↔ person_id` mapping. An empty DB result is a valid
empty state; it must never trigger a silent JSON or persona fallback.

## 3. Recommendation design

Every person can both need and offer something. UI role labels must not fix the
direction of a match.

```text
forward(A, B) = A.need/activity requirements → B.offers/evidence
reverse(A, B) = B.need/activity requirements → A.offers/evidence

reciprocal = compare(minimum, harmonic mean, geometric mean)
pair_score = reciprocal
           × consent/capacity/feasibility gates
           + activity/impact alignment
           + organization graph evidence
           + freshness/diversity/exposure adjustment
```

Generate candidates from exact taxonomy, lexical search, dense retrieval, and
organization/collaboration graph evidence. Fuse channels before reciprocal
reranking. At the current eight-person scale, use exhaustive comparison rather
than ANN/HNSW.

The first recommendation card is `person + concrete conversation/activity
topic`, not a bare similarity percentage.

## 4. Canonical people schema

Keep source entities separate. `MemberProfile` may remain only as a
compatibility view.

- Identity and context: `people`, `organizations`, `affiliations`,
  `role_assertions`, `entity_aliases`
- Current intent: `impact_intents`, `activity_intents`,
  `activity_requirements`, `activity_contributions`, `need_intents`,
  `capability_offers`, `collaboration_preferences`
- Evidence: `experiences`, `experience_skills`, `trust_claims`,
  `evidence_claims`
- Safety and history: `consent_records`, `profile_revisions`, `blocks`,
  `deletion_requests`
- Recommendation: `match_documents`, `embedding_spaces`,
  `embedding_records`, `recommendation_runs`,
  `recommendation_candidates`, `recommendation_exposures`,
  `introduction_requests`, `meeting_outcomes`,
  `collaboration_outcomes`

Onboarding should ask for the smallest useful state:

1. one 30–90 day `activity_intent`;
2. connection direction (`need`, `offer`, or both);
3. at least one record for the selected direction;
4. capacity and feasibility constraints;
5. separate public-display, matching, and embedding consent.

Ask for the other direction and experience evidence adaptively. A person
without a prior project must still be able to join.

## 5. Embedding contract

Do not create a canonical one-vector-per-person representation.

- One structured activity, need, offer, impact intent, or experience becomes
  one `MatchDocument`; do not chunk it.
- Only `user-confirmed`, PII-redacted `safe_match_text` is eligible.
- Exact location, exact schedule, capacity, blocks, consent, and eligibility
  stay structured filters/features rather than embedding text.
- External long-form documents are parsed and chunked only for evidence
  retrieval and provenance.

Maintain separate spaces:

| Space | Purpose | Candidate status |
|---|---|---|
| `people_matching_v1` | Current user-confirmed need/offer/activity/impact/experience | Can influence recommendation after gates |
| `evidence_retrieval_v1` | Authorized external posts, cases, and organization evidence | Evidence candidate only until reviewed |

Model bake-off:

- Korean primary: `nlpai-lab/KURE-v1`
- Multilingual baseline: `BAAI/bge-m3`
- Both: 1024 dimensions, normalized cosine, shadow evaluation first

For a people-only map, calculate pair edges from reciprocal directional
retrieval and use a derived two-dimensional layout for display. The layout is
not a new canonical person vector and must not be stored as identity truth.

## 6. External blog boundary

The user directly authorized local collection of the supplied Naver blog's
`사혁넷 사람들` category on 2026-07-29. A local-only validation corpus and
evidence embeddings were created; no Supabase rows were written and no corpus,
vector, secret, or SQLite artifact is committed to this repository. See
`docs/decisions/2026-07-29-local-evidence-schema-reference.md` for counts,
schema lineage, and the exact model revision.

For every authorized source, record permitted uses, retention, deletion,
source artifact hash, parser version, redaction version, and provenance.

```text
source document
→ entity mention
→ entity-link candidate
→ operator and subject confirmation
→ profile/evidence claim
→ approved MatchDocument
```

Do not infer a person's current need, activity, availability, or consent from
an old public biography. External people are not recommendation candidates
until discoverability and matching consent are explicit.

## 7. Vocabulary and revision history

Preferred UI labels:

- `social_innovation_activist`: 사회혁신활동가
- `social_innovation_supporter`: 사회혁신지원가
- interim inclusive partner label: 사회혁신 협력 파트너

Main commit `08eec42` proposed `일반기업` for the C layer. Keep that label for
the C1 `일반기업형` context only: the current C layer also contains
professional-service, public, academic, media, and nonprofit organizations.
Follow
`docs/decisions/2026-07-29-main-08eec42-integration-plan.md`
when integrating the main update.

Stable concept IDs and display labels are separate. Every label proposal,
activation, deprecation, block, split, and merge is append-only and belongs to
a versioned release. Historical profiles retain the vocabulary version and
label revision used at that time.

Avoid using role labels to imply a fixed supplier/customer hierarchy.

## 8. M0/M1 handoff and merge boundary

Claude implemented the local worktree
`.worktrees/matching-m0m1` on branch `agent/matching-m0m1` from base
`3c9d275`.

Local commits reported at handoff:

1. `bd33b7f` — versioned vocabulary contract
2. `307ee60` — people-domain contract and lossless eight-person conversion
3. `a449389` — reciprocal matching engine
4. `dc9eaa7` — DAL/onboarding/three-part consent
5. `5e5e10d` — deterministic evaluation harness

Reported checks were 86/86 Vitest, TypeScript clean, build success, and no DB
write. These commits must still pass independent review and be intentionally
integrated; do not blindly merge or cherry-pick based only on this note.

The uncommitted `package-lock.json` change predates/does not belong to this
handoff bundle unless separately explained and approved.

## 9. Next sequence

1. Finish review of M0/M1 and address findings.
2. Integrate reviewed commits into the feature branch.
3. Add `safe_match_text` confirmation and MatchDocument builder.
4. Run KURE-v1 vs BGE-M3 shadow evaluation on the same Korean gold set.
5. Show a people-only reciprocal graph and evidence-backed edge explanation.
6. Move to Supabase/RLS/pgvector only after explicit approval and JSON/DB parity
   tests.

Production-quality claims require consenting users and blinded relevance
labels. The eight seed members are smoke/regression data only.

## 10. Resolved implementation questions

- Count `subgroup_map` with an exact server-side count and record whether RLS
  was applied. Prefer Supabase
  `.select("id", { count: "exact", head: true })`; if headers are unavailable,
  use GET with `Prefer: count=exact`, `Range: 0-0`, and inspect
  `Content-Range`.
- Onboarding requires at least one and allows at most three Need/Offer records.
  With one item it is automatically primary; with two or three, exactly one is
  primary.
- M2 is not BGE-M3-only. Compare KURE-v1 as the Korean primary candidate with
  BGE-M3 as the multilingual baseline using the same gold set and separate
  `space_id/model_id` values.
