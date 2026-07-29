---
schema_version: shuzzi-md/v1
doc_kind: narrative_note
project_slug: hackathon-naverconnect
created_at: 2026-07-29T14:21:08+09:00
updated_at: 2026-07-29T14:21:08+09:00
timezone: Asia/Seoul
status: integration_plan
source_artifact_sha256: 3937d1cb986e880f090d09abcd6917c01a446658da99ffe3e2810c5f73368b74
---

# Demo viewer integration plan

This defines how to bring the useful interaction and visual hierarchy from the
local `viewer-v2.html` into `feature/naverconnect_cooperativework` without
committing the full public-blog corpus, model artifacts, or unreviewed entity
links.

## Decision

Integrate the design and an allowlisted data contract as a feature-flagged
Next.js route. Do not copy the current standalone HTML into `public/demo/`.

Recommended preview route:

```text
/labs/people-matching
```

The route is a temporary integration surface. After the M0/M1 privacy and
matching contracts pass review, its approved parts can replace or compose with
the existing `/recommendations` experience.

## Why the standalone HTML must remain local

The reviewed local artifact is approximately 1 MiB and embeds one large
`const DATA` payload. It contains:

- 522 public posts, including 436 person-like and 86 organization posts;
- names, roles, titles, source URLs, dates, short quotes, and two body
  paragraphs;
- primary and secondary keyword pools;
- 185 unreviewed organization-link candidates;
- KURE-v1-derived two-dimensional coordinates;
- pre-ranked neighbor IDs and people-to-people display edges.

It does not contain the raw 1,024-dimensional vectors or numeric cosine scores,
but coordinates, neighbor order, and edges are still model-derived artifacts.
Several organization links are review candidates rather than accepted entity
links.

Putting this file under `public/` would:

1. distribute the entire payload to every visitor;
2. bypass the app's server authorization and `DATA_SOURCE` boundary;
3. bypass the current privacy gate, which scans `.next/static/chunks` and
   derived fixtures but not arbitrary `public/` files;
4. present old public biographies as if they were current matchable profiles;
5. duplicate design tokens, accessibility behavior, and data-loading logic.

The full 522-post viewer remains a local evidence/design diagnostic with its
hash recorded above. It is not the production recommendation UI.

## Placement

Use the existing Next.js application:

```text
src/app/labs/people-matching/page.tsx
src/components/labs/people-matching/
src/lib/server/demo-viewer.ts
src/types/demo-viewer.ts
scripts/demo/build-viewer-projection.py
docs/demo/people-matching-viewer.md
var/demo/people-matching.json          # generated, gitignored
```

Rules:

- `page.tsx` is a server component.
- `src/lib/server/demo-viewer.ts` imports `server-only`.
- The route returns `notFound()` unless a server-side
  `ENABLE_PEOPLE_MATCHING_LAB=1` flag is set.
- Pilot mode remains disabled until real authentication, member mapping,
  consent, and RLS exist.
- Interactive client components receive only the selected profile and its
  allowlisted recommendation projection, never the 522-record corpus.
- Reuse the repository design tokens and versioned vocabulary resolver.

Do not use a `NEXT_PUBLIC_*` flag as the authorization boundary. A public flag
may control presentation after the server gate, but it cannot protect data.

## UI contract to carry over

Keep the successful parts of viewer-v2:

1. Korean editorial profile hierarchy;
2. people-first feed;
3. exactly three primary suggestions when three eligible suggestions exist;
4. separate “why this helps me” and “why this helps them” explanations;
5. one evidence-backed first-conversation topic;
6. people-only map as a secondary tab;
7. honest insufficient-evidence state instead of filling empty slots;
8. no recommendation probability.

Do not carry over:

- full biography paragraphs in the client payload;
- all-person search over the unconfirmed external corpus;
- unreviewed organization links;
- PCA coordinates or KURE neighbor rankings as identity truth;
- connection actions for people who are not authenticated, consenting members.

## Data contract

The client DTO should be purpose-built and allowlisted:

```ts
type PeopleMatchingLabView = {
  selected: {
    personId: string;
    displayName: string;
    publicHeadline: string;
    publicActivity: string;
    vocabularyVersion: string;
  };
  suggestions: Array<{
    personId: string;
    displayName: string;
    publicHeadline: string;
    reasonForViewer: string;
    reasonForSuggestedPerson: string;
    firstConversationTopic: string;
    evidenceLabels: string[];
  }>;
  insufficientEvidence: boolean;
  provenance: {
    dataMode: "approved-demo";
    modelId?: string;
    modelRevision?: string;
    generatedAt: string;
  };
};
```

Do not include raw `safe_match_text`, biography quotes, paragraph arrays,
private Need/Offer text, exact availability, model vectors, similarity scores,
decline state, meeting outcomes, or unreviewed entity-link payloads.

The initial checked-in preview should consume only the approved/redacted M0/M1
demo profiles. A tiny deterministic fixture is acceptable for UI tests; a
522-person derived fixture is not.

## Reproducibility

Commit:

- a parameterized projection script with no absolute paths or secrets;
- the DTO schema and sanitizer;
- model ID/revision, parser/template versions, aggregate counts, and hashes;
- a tiny approved demo fixture or tests generated from existing redacted
  seeds;
- reproduction and deletion instructions.

Do not commit:

- the source blog HTML/JSON;
- the local SQLite database;
- 1,024-dimensional vectors;
- two-dimensional coordinates for the 522 people;
- all-person neighbor lists or edges;
- extracted quotes/paragraphs;
- `proposed` claims or `needs_review` link candidates.

The local builder may read
`~/Desktop/naverconnect-embedding-local/naverconnect-embeddings.sqlite`, but
the committed script must accept an explicit input path and write only to the
gitignored `var/demo/` directory. Its deterministic manifest should hash the
input, script, model revision, and output.

## Evidence-pipeline boundary

The extraction pipeline remains upstream evidence tooling:

```text
source document
→ evidence fragment
→ entity mention
→ link candidate (needs_review)
→ link decision
→ profile claim (proposed)
→ field approval + matching consent
→ safe MatchDocument
→ people_matching_v1
→ recommendation projection
```

`entity_mentions`, `profile_claims(status=proposed)`, and
`link_candidates(status=needs_review)` must not feed recommendation cards.

The local evidence viewer may display them as diagnostics with explicit state
labels. The application route may use only accepted links, approved profile
fields, valid safe-match approval receipts, and matching consent.

## Privacy-gate changes

Before enabling the route, extend the gate to cover the new surface:

- validate `PeopleMatchingLabView` with an exact key allowlist;
- scan any committed/generated demo artifact, not only client chunks;
- probe for forbidden keys such as `quote`, `paras`, `kw2`, `vector_f32`,
  `cosine_similarity`, `detail_quote`, `meeting_outcome`, and
  `decline_reason`;
- assert that client chunks contain no 522-record corpus or raw biography
  phrases;
- run both demo and pilot build matrices with the lab flag on and off;
- assert that pilot/off returns no route data;
- set a payload-size ceiling for the selected-profile projection.

No raw data is made safe merely by being publicly readable elsewhere.

## Branch and commit sequence

Keep this work separate from the active M0/M1 C1–C5 correction track.

1. Complete and independently approve M0/M1.
2. Integrate the reviewed main terminology update and vocabulary resolver.
3. Create `agent/demo-viewer-integration` from the updated feature branch.
4. Commit D0: route/data contract, gitignore, documentation, failing privacy
   tests.
5. Commit D1: server-gated route shell and components using a tiny approved
   fixture.
6. Commit D2: server projection adapter from reviewed M0/M1 data and the
   extended privacy gate.
7. Commit D3: parameterized local reproduction script and deterministic
   manifest.
8. Run independent review before merging back to
   `feature/naverconnect_cooperativework`.

Do not cherry-pick the 1 MiB standalone HTML into the feature branch.

## Acceptance criteria

- route is unavailable when the server-side lab flag is off;
- pilot mode cannot silently fall back to demo/JSON data;
- exactly three eligible people are shown, or an explicit insufficient state;
- every suggestion has bilateral reasons and a conversation topic from
  approved fields;
- no probability or raw similarity score is displayed;
- map nodes are people only and the map remains secondary;
- no unconfirmed external person becomes connectable;
- no `needs_review` link or `proposed` claim influences a card;
- privacy gate, TypeScript, lint, unit tests, build, and migration-idempotency
  checks pass;
- the full local viewer remains reproducible without becoming a committed
  client payload.
