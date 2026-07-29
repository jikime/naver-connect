#!/usr/bin/env python3
"""Re-project the public member space after an onboarding profile update."""

from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parents[1]
BUILDER_PATH = ROOT / "scripts" / "build-member-embedding-shadow.py"


def load_builder() -> Any:
    spec = importlib.util.spec_from_file_location("member_shadow_builder", BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("member embedding builder could not be loaded")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    builder = load_builder()
    payload = json.load(sys.stdin)
    profile = payload["profile"]
    member_id = profile["member_id"]

    members = builder.load_json(builder.SOURCE_PATHS[0])
    offers = builder.load_json(builder.SOURCE_PATHS[1])
    tags = builder.load_json(builder.SOURCE_PATHS[2])
    tag_name_by_id = {tag["id"]: tag["name"] for tag in tags}
    members = sorted(members, key=lambda member: member["id"])

    target_index = next(
        (index for index, member in enumerate(members) if member["id"] == member_id),
        None,
    )
    if target_index is None:
        raise ValueError("unknown member_id")

    target = copy.deepcopy(members[target_index])
    target["org"] = profile["organization"]
    target["region"] = profile["region"]
    target["field_tags"] = profile["field_tags"]
    target["value_chain_stage"] = profile["value_chain_stage"]
    target["mission_statement"] = profile["mission_statement"]
    target["visibility"]["public"].update(
        {
            "supply_tags": profile["supply_tags"],
            "activities": profile["activities"],
            "preferred_mode": profile["preferred_mode"],
            "region": profile["region"],
        }
    )
    members[target_index] = target

    offers_by_owner: dict[str, list[dict[str, Any]]] = {}
    for offer in offers:
        owner = offer.get("owner", {})
        if owner.get("kind") == "person" and owner.get("id") != member_id:
            offers_by_owner.setdefault(owner["id"], []).append(offer)
    offers_by_owner[member_id] = [
        {
            "owner": {"kind": "person", "id": member_id},
            "tag_ids": [supply["tagId"]],
            "detail": supply["detail"],
            "status": "active",
        }
        for supply in profile["supply_tags"]
    ]

    documents = [
        builder.document_for(member, offers_by_owner, tag_name_by_id)
        for member in members
    ]
    model = SentenceTransformer(
        str(builder.MODEL_PATH),
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
    coords, explained_variance = builder.normalized_projection(vectors)
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

    public_payload = json.dumps(profile, ensure_ascii=False, sort_keys=True)
    artifact = {
        "schema_version": "member_embedding_shadow/1.0",
        "space_id": "people_matching_public_profile_v1-kure-v1",
        "model": {
            "id": "nlpai-lab/KURE-v1",
            "revision": builder.MODEL_REVISION,
            "dimensions": int(vectors.shape[1]),
            "normalized": True,
        },
        "input": {
            "source_sha256": hashlib.sha256(
                public_payload.encode("utf-8")
            ).hexdigest(),
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
    json.dump(artifact, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
