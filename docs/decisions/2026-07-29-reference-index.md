---
schema_version: shuzzi-md/v1
doc_kind: narrative_note
project_slug: hackathon-naverconnect
created_at: 2026-07-29T11:53:49+09:00
updated_at: 2026-07-29T13:56:48+09:00
timezone: Asia/Seoul
status: reference_index
---

# People matching reference index

Read this after
`docs/decisions/2026-07-29-people-matching-read-first.md`.

## Attached decision and research snapshots

- `docs/decisions/2026-07-29-embedding-decision-register.md`
- `docs/decisions/2026-07-29-local-evidence-schema-reference.md`
- `docs/research/2026-07-29-people-match-retrieval-plan.md`
- `docs/research/2026-07-29-research-synthesis.md`
- `docs/research/2026-07-29-research-raw.md`

The append-only cross-agent work log remains local at
`~/.claude/projects/-Users-shuzzi/memory/inbox/naver-connect/20260729.md`.
It is not required to understand or continue the checked-in decisions.

The local-evidence schema reference records the authorized 522-post validation,
the Supabase read-only counts, the local KURE-v1 parsing/embedding results, and
the boundary between evidence retrieval and user-confirmed people matching.
No raw corpus, vector, secret, or SQLite database is committed.

## Retrieval and reciprocal recommendation

- [LinkedIn Engineering — People You May Know](https://engineering.linkedin.com/teams/data/artificial-intelligence/people-you-may-know)
- [Google Research — Deep Neural Networks for YouTube Recommendations](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/)
- [KDD 2024 — Revisiting Reciprocal Recommender Systems](https://arxiv.org/abs/2408.09748)
- [Reciprocal explanations for recommendation](https://arxiv.org/abs/1807.01227)
- [Supabase — Hybrid Search](https://supabase.com/docs/guides/ai/hybrid-search)
- [Supabase — Semantic Search](https://supabase.com/docs/guides/ai/semantic-search)

## Korean and multilingual embedding baselines

- [KURE-v1 model card](https://huggingface.co/nlpai-lab/KURE-v1)
- [BGE-M3 model card](https://huggingface.co/BAAI/bge-m3)

## Authorized external-source ingestion

- [Naver Blog robots policy](https://blog.naver.com/robots.txt)
- [Naver Blog backup guide](https://help.naver.com/service/5593/contents/15293)
- [Naver Blog backup file limits](https://help.naver.com/service/5593/contents/15295)
- [Naver blog search API](https://developers.naver.com/docs/serviceapi/search/blog/blog.md)

## Visual directions

The generated concept images are in
`docs/design-concepts/people-matching/` and in the user's
`~/Desktop/naverconnect-mockups/` preview folder.

- A: LinkedIn-like people relationship path
- B: Pinterest-like activity discovery board
- C: Korean editorial activity/profile view

Recommended synthesis: use C as the visual base, A's relationship-path drawer
for person-to-person explanation, and B only as an optional activity discovery
view. None of the concepts is a final production specification.

All three images are synthetic design concepts generated for ideation. Their
portraits, names, organizations, metrics, and relationship copy are not
Supabase records and must not be presented as real members or real matches.
