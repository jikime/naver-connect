#!/usr/bin/env python3
"""Build the public member embedding shadow used by the weekly match map.

The committed artifact intentionally contains no raw 1024D vectors and no
private need quotes. Recommendation ranking remains the rule engine's job; this
script only projects public profile language for spatial exploration.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
OUTPUT_PATH = DATA_DIR / "people" / "derived" / "member-embedding-shadow.json"
MODEL_REVISION = "d14c8a9423946e268a0c9952fecf3a7aabd73bd9"
MODEL_PATH = (
    Path.home()
    / ".cache"
    / "huggingface"
    / "hub"
    / "models--nlpai-lab--KURE-v1"
    / "snapshots"
    / MODEL_REVISION
)
SOURCE_PATHS = (
    DATA_DIR / "members.json",
    DATA_DIR / "people" / "offers.json",
    DATA_DIR / "tags.json",
)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def source_sha256(paths: tuple[Path, ...]) -> str:
    digest = hashlib.sha256()
    for path in sorted(paths):
        digest.update(str(path.relative_to(ROOT)).encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def document_for(
    member: dict[str, Any],
    offers_by_owner: dict[str, list[dict[str, Any]]],
    tag_name_by_id: dict[int, str],
) -> str:
    public = member["visibility"]["public"]
    field_names = [
        tag_name_by_id[tag_id]
        for tag_id in member.get("field_tags", [])
        if tag_id in tag_name_by_id
    ]
    offer_lines = [
        f"{', '.join(tag_name_by_id.get(tag_id, str(tag_id)) for tag_id in offer['tag_ids'])}: {offer['detail']}"
        for offer in offers_by_owner.get(member["id"], [])
        if offer.get("status") == "active"
    ]
    return "\n".join(
        (
            f"사회혁신 미션: {member['mission_statement']}",
            f"활동 분야: {', '.join(field_names)}",
            f"핵심 키워드: {', '.join(member['keyword_set'])}",
            f"제공할 수 있는 경험과 자원: {'; '.join(offer_lines)}",
            f"선호 활동: {', '.join(public['activities'])}",
            f"협업 방식: {public['preferred_mode']}",
            (
                "조직 맥락: "
                f"{member['org']['type']}, {member['value_chain_stage']}, "
                f"{member['org']['role']}"
            ),
            (
                "활동 지역: "
                f"{public['region']['sido']} {public['region']['sigungu']}"
            ),
        )
    )


def normalized_projection(vectors: np.ndarray) -> tuple[np.ndarray, list[float]]:
    centered = vectors - vectors.mean(axis=0, keepdims=True)
    _, singular_values, right_vectors = np.linalg.svd(centered, full_matrices=False)
    coords = centered @ right_vectors[:2].T

    # SVD axis signs are otherwise arbitrary. Anchor them to M-001 for a stable
    # checked-in layout, then normalize each axis into the SVG-friendly range.
    for axis in range(2):
        if coords[0, axis] < 0:
            coords[:, axis] *= -1
    # One scale for both axes preserves the projected geometry. Per-axis
    # normalization would visually stretch one principal component.
    scale = float(np.max(np.abs(coords)))
    if scale > 0:
        coords /= scale

    variance = singular_values**2
    explained = variance[:2] / variance.sum()
    return coords, [round(float(value), 6) for value in explained]


def main() -> None:
    if not MODEL_PATH.exists():
        raise SystemExit(f"Local KURE model not found: {MODEL_PATH}")

    members: list[dict[str, Any]] = load_json(SOURCE_PATHS[0])
    offers: list[dict[str, Any]] = load_json(SOURCE_PATHS[1])
    tags: list[dict[str, Any]] = load_json(SOURCE_PATHS[2])
    tag_name_by_id = {tag["id"]: tag["name"] for tag in tags}
    offers_by_owner: dict[str, list[dict[str, Any]]] = {}
    for offer in offers:
        owner = offer.get("owner", {})
        if owner.get("kind") == "person":
            offers_by_owner.setdefault(owner["id"], []).append(offer)

    members = sorted(members, key=lambda member: member["id"])
    documents = [
        document_for(member, offers_by_owner, tag_name_by_id) for member in members
    ]
    model = SentenceTransformer(
        str(MODEL_PATH),
        local_files_only=True,
        device="cpu",
    )
    model.max_seq_length = 512
    vectors = model.encode(
        documents,
        batch_size=8,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    ).astype(np.float32)
    coords, explained_variance = normalized_projection(vectors)
    cosine = vectors @ vectors.T

    nodes: list[dict[str, Any]] = []
    pairs: list[dict[str, Any]] = []
    for index, member in enumerate(members):
        neighbor_indexes = sorted(
            (other for other in range(len(members)) if other != index),
            key=lambda other: (-float(cosine[index, other]), members[other]["id"]),
        )[:3]
        nodes.append(
            {
                "member_id": member["id"],
                "x": round(float(coords[index, 0]), 6),
                "y": round(float(coords[index, 1]), 6),
                "document_sha256": hashlib.sha256(
                    documents[index].encode("utf-8")
                ).hexdigest(),
                "top_neighbors": [
                    {
                        "member_id": members[other]["id"],
                        "cosine": round(float(cosine[index, other]), 6),
                    }
                    for other in neighbor_indexes
                ],
            }
        )
        for other in range(index + 1, len(members)):
            pairs.append(
                {
                    "a": member["id"],
                    "b": members[other]["id"],
                    "cosine": round(float(cosine[index, other]), 6),
                }
            )

    artifact = {
        "schema_version": "member_embedding_shadow/1.0",
        "space_id": "people_matching_public_profile_v1-kure-v1",
        "model": {
            "id": "nlpai-lab/KURE-v1",
            "revision": MODEL_REVISION,
            "dimensions": int(vectors.shape[1]),
            "normalized": True,
        },
        "input": {
            "source_sha256": source_sha256(SOURCE_PATHS),
            "public_fields": [
                "mission_statement",
                "field_tags",
                "keyword_set",
                "active_offers",
                "visibility.public.activities",
                "visibility.public.preferred_mode",
                "org.type",
                "org.role",
                "value_chain_stage",
                "visibility.public.region",
            ],
            "private_fields_included": False,
        },
        "projection": {
            "method": "centered_svd_2d",
            "explained_variance_ratio": explained_variance,
            "global_distance_is_exact": False,
        },
        "nodes": nodes,
        "pairs": pairs,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(artifact, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)} ({len(nodes)} members)")


if __name__ == "__main__":
    main()
