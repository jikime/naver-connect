---
schema_version: shuzzi-md/v1
doc_kind: narrative_note
project_slug: hackathon-naverconnect
created_at: 2026-07-29T14:08:00+09:00
updated_at: 2026-07-29T14:08:00+09:00
timezone: Asia/Seoul
status: integration_plan
source_commit: 08eec42f6576f6494920f640e73397c7a8e57b97
---

# Main `08eec42` terminology update: integration plan

This records how to incorporate
`refactor: clarify collaboration group labels` from `origin/main` without
discarding terminology history or turning a subgroup label into an inaccurate
umbrella label.

At review time:

- `origin/main` had one commit after the feature branch's merge base;
- `feature/naverconnect_cooperativework` was two commits ahead and one commit
  behind;
- `git merge-tree` reported no textual conflict;
- the change is mechanically mergeable but requires a semantic follow-up.

## What main changed

| Layer | Previous display | Main `08eec42` display | Decision |
|---|---|---|---|
| A | 활동가 | 사회혁신활동가 | Accept as preferred |
| B | 지원가 | 사회혁신지원가 | Accept as preferred |
| C | 비사회적기업 | 일반기업 | Do not use as the C umbrella |

The intent to remove the negative `비사회적기업` label is correct. The main
commit directly replaces strings in components, DAL constants, type comments,
and several rationale sentences, but it does not record a vocabulary revision.

## Why `일반기업` cannot be the C umbrella

The current 80-row subgroup snapshot contains 17 C-layer organizations:

| Subgroup | Label | Rows |
|---|---|---:|
| C1 | 일반기업형 | 1 |
| C2 | 전문서비스파트너형 | 8 |
| C4 | 학계·공공·언론형 | 8 |

C4 includes LH, SH, 국민건강보험공단, 건강보험심사평가원, 조달청,
KAIST 사회적가치연구소, and a nonprofit environmental organization.
Calling the full layer `일반기업` would therefore misclassify public,
academic, media, and nonprofit actors as companies.

## Vocabulary decision

Use two levels rather than one overloaded label.

### Layer-level role concepts

| Legacy storage value | Stable concept ID | Preferred display |
|---|---|---|
| `activist` / `A` | `nvc.role.activist` | 사회혁신활동가 |
| `supporter` / `B` | `nvc.role.supporter` | 사회혁신지원가 |
| `non-social` / `C` | `nvc.role.ally` | 사회혁신 협력 파트너 |

`사회혁신 협력 파트너` remains an interim preferred label pending pilot
feedback. It describes the heterogeneous C layer without asserting that every
member is a company.

### Subgroup-level context labels

- C1: `일반기업`
- C2: `전문서비스 파트너`
- C3: `글로벌·대기업 파트너` when data exists
- C4: `학계·공공·언론 파트너`

`일반기업` from `08eec42` is retained as a valid C1 context label and as a
recorded proposal from main, not discarded or silently overwritten.

### History treatment

The integration must preserve these events:

1. legacy `활동가` deprecated;
2. `사회혁신활동가` activated;
3. legacy `지원가` deprecated;
4. `사회혁신지원가` activated;
5. legacy `비사회적기업` blocked for display but retained for audit/search;
6. `사회혁신 협력 파트너` activated as interim C-layer preferred;
7. `일반기업` proposed/accepted only for C1 context, with `08eec42` as
   provenance.

Historical events keep `concept_id`, `vocabulary_version`, and optionally the
original `label_snapshot`. The technical `non-social` value remains only as a
compatibility alias until a separate data migration; it must not reach the UI.

## Code integration

Do not keep role display strings in multiple ternaries or constant maps.

1. Integrate the reviewed M0/M1 versioned vocabulary contract.
2. Map legacy `SubgroupKind` values to stable concept IDs at the DAL boundary.
3. Resolve layer labels through `resolveDisplayLabel(concept_id)`.
4. Resolve C1–C4 labels through a subgroup-context vocabulary map.
5. Keep scoring keys such as `non-social-activist` temporarily internal; rename
   them only in a separately tested migration.
6. Keep Need/Offer direction independent from A/B/C identity labels. A person
   or organization may need and offer in the same reciprocal match.

Expected replacement points from main:

- `src/components/collaboration/CollabRelationMap.tsx`
- `src/lib/dal/collaboration.ts`
- `src/types/collaboration.ts`
- `src/data/subgroup_map.json`

The component and DAL should consume the vocabulary resolver. Source rationale
text may keep a historical snapshot but should not act as a canonical label.

## Merge sequence

1. Finish Claude's M0/M1 P1 fixes and independent re-review.
2. Use a clean integration worktree; do not include the unrelated local
   `package-lock.json` change.
3. Merge `origin/main` so commit `08eec42` retains authorship and provenance.
4. Integrate the reviewed vocabulary contract.
5. Apply the resolver/context-label follow-up in the same integration batch.
6. Run unit, type, lint, build, privacy, and migration-idempotency checks.
7. Push only after the feature branch contains both the main change and the
   semantic follow-up.

This avoids publishing an intermediate feature build in which the entire C
layer is labeled `일반기업`.

## Required regression checks

- A renders `사회혁신활동가`; B renders `사회혁신지원가`.
- C layer renders `사회혁신 협력 파트너`.
- `일반기업` is used for C1 context only.
- C2 and C4 never render as `일반기업`.
- `비사회적기업` never appears in a user-facing path.
- Audit/search can still resolve deprecated and blocked historical labels.
- Vocabulary event history contains `08eec42` provenance.
- A/B/C labels do not determine Need/Offer direction.
- Demo and pilot modes resolve the same vocabulary version deterministically.

## Claude review request

Claude was asked to independently verify:

- whether the M0/M1 vocabulary contract already covers the main delta;
- whether `일반기업` should be an alternative revision or a separate C1
  context concept;
- which commit should own the resolver integration;
- whether any privacy/migration gates need another fixture after main is
  integrated.

Do not mark the terminology integration complete until that response and the
post-merge checks are recorded.
