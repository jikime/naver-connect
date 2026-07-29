---
schema_version: shuzzi-md/v1
doc_kind: narrative_note
project_slug: hackathon-naverconnect
created_at: 2026-07-29T15:10:20+09:00
updated_at: 2026-07-29T15:10:20+09:00
timezone: Asia/Seoul
status: validated_local_prototype
viewer_sha256: f4b30d860fdd5906e57a46ce24d977fa37bb09a9992df59936b900c7b1af5b15
builder_sha256: 28135b4ea69971ab7d9d03918a91ba1c76c723b656dbee9631fcbf26bf03eafb
---

# Embedding map v5 validation and relationship-view decision

This records the investigation prompted by the local viewer drawing long
connections between people who appeared far apart. It supersedes the visual
assumption in viewer-v2/v3 that a global two-dimensional projection and the
displayed top-three neighbor graph can share one geometry.

The full local viewer, source blog corpus, SQLite database, vectors, coordinates,
and neighbor lists remain outside Git. This document carries only the aggregate
results and integration contract.

## Root cause

The original viewer mixed two different spaces:

- node positions came from a two-dimensional PCA projection;
- connection candidates came from the original 1,024-dimensional KURE-v1
  cosine ranking plus a public-evidence filter.

PCA's first two axes explained only 7.58% of variance. A selected-person overlay
then drew all three original-space candidates even when the background edge
filter had removed them. The rendered X and Y scales also differed, which
visually distorted distance.

This was not an HTML limitation and it was not a vector-normalization failure.
All 522 stored KURE-v1 vectors were 1,024-dimensional and unit-normalized within
floating-point tolerance. The failure was treating a lossy projection as if it
were the recommendation graph.

## Projection evaluation

Evaluation used the same 436 person-like blog-post records and original
KURE-v1 cosine top-three neighbors.

| Projection | Trustworthiness@3 | Neighbor recall@3 |
| --- | ---: | ---: |
| PCA 2D | 0.6980 | 0.0298 |
| UMAP 2D, n=10, min_dist=0.05 | 0.8442 | 0.3096 |
| UMAP 2D, n=3, min_dist=0.00 | 0.8886 | 0.4450 |
| t-SNE 2D, perplexity=20 | 0.9348 | 0.3815 |
| UMAP 3D, n=3, min_dist=0.05 | 0.9057 | 0.4656 |
| t-SNE 3D, perplexity=20 | 0.9548 | 0.4304 |

The best tested three-dimensional projection preserved only 46.6% of the
original top-three slots. Of 436 records:

- 27 preserved none of their original top-three neighbors in 3D;
- 230 preserved one;
- 158 preserved two;
- 21 preserved all three.

Three dimensions therefore improve diagnostics but do not make the projection
an exact relationship map.

## Reference interaction pattern

The corrected contract follows the separation used by:

- [Apple Embedding Atlas](https://apple.github.io/embedding-atlas/overview.html),
  which treats projection coordinates and precomputed neighbors as separate
  inputs and exposes neighbors for a selected point;
- [TensorFlow Embedding Projector](https://projector.tensorflow.org/), which
  separates UMAP/t-SNE/PCA projections from selection isolation and neighbor
  controls;
- [D3 link force](https://d3js.org/d3-force/link), whose geometry is appropriate
  for a relationship graph because links participate in placement.

The product must not draw a global k-nearest-neighbor web over a lossy embedding
projection and imply that both express the same distance.

## Layout comparison

The local diagnostic compared UMAP, spring, ForceAtlas2, Kamada-Kawai,
SpectralEmbedding, and ARF layouts over the displayed evidence-filtered top-three
graph:

- nodes: 436 person-like blog-post records;
- union top-three graph edges: 1,004;
- connected components: 1;
- mutual top-three context edges: 304.

The selected spring layout was chosen for relationship context because:

- 100% of its directed top-three edges were shorter than the median distance of
  all possible pairs;
- 97.8% were shorter than the first-quartile all-pair distance;
- the layout is deterministic with seed 42 and 800 iterations.

ForceAtlas2 preserved more exact local ranks, but still left long edges that
reproduced the original usability complaint. The relationship view optimizes
for readable links; the embedding atlas remains the semantic-distribution
diagnostic.

## Viewer-v5 contract

The local `viewer-v5.html` defaults to a relationship-first map:

1. the selected record is fixed at the center;
2. exactly the same three candidates shown in the recommendation side panel are
   placed at a fixed readable radius;
3. exactly three dashed candidate edges are drawn;
4. the faded background uses the spring layout of the top-three relationship
   graph;
5. selecting a background node re-centers the same contract on that record;
6. the raw UMAP point cloud is available only through a separate
   “전체 임베딩 분포” mode;
7. the UMAP mode has zero global relationship edges.

The fixed-radius foreground is an explicit focus view. Edge length does not
encode cosine similarity, probability, or an accepted real-world relationship.
Candidate edges remain dashed until bilateral consent and relationship state
exist.

## Local validation

The final local artifacts were:

```text
viewer-v5.html              1,040,636 bytes
build_viewer_v5_data.py        15,396 bytes
```

SHA-256 values are recorded in the front matter. Browser contract testing with
Chrome passed:

- relationship foreground nodes: 4;
- relationship candidate edges: 3;
- side-panel candidate rows: 3;
- foreground candidate IDs equal `neighbors[selected][:3]`;
- changing the selected background node preserves the 4/3/3 contract;
- UMAP mode nodes: 436;
- UMAP mode global lines: 0;
- page runtime errors: 0.

## Production boundary

The 436 nodes are blog-post records, not verified canonical people. Same-name
posts are excluded from one another's recommendation candidates, but they are
not automatically merged. Unreviewed organization candidates and blog identity
links are not relationship truth.

Production integration therefore still requires:

```text
source authorization
→ evidence fragment
→ user_claimed_subject
→ reviewed canonical_person link
→ approved profile fields
→ valid safe-match receipt
→ matching and embedding consent
→ people_matching_v1
→ recommendation projection
```

The app may reuse the relationship-first interaction, but must use the
server-gated allowlisted DTO defined in
`2026-07-29-demo-viewer-integration-plan.md`. Do not commit or serve the local
1 MiB viewer, full corpus, SQLite database, coordinates, vectors, or all-person
neighbor graph.

## Acceptance rule for future work

- use a projection for distribution, clusters, search, and diagnostic QA;
- use the original matching graph for recommendation relationships;
- use selection focus or an ego graph when visible edges must be exact;
- require visible suggestion IDs and visible edge targets to match 100%;
- evaluate recommendation quality with a labeled gold set, Precision@3,
  Recall@K, nDCG, reciprocal value, consent, and coverage, not 2D neighbor
  recall.
