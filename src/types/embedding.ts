export interface PublicEmbeddingProfile {
  member_id: string;
  publish_profile: true;
  organization: { name: string; type: string; role: string };
  region: { sido: string; sigungu: string };
  field_tags: number[];
  value_chain_stage: string;
  mission_statement: string;
  supply_tags: { tagId: number; detail: string }[];
  activities: string[];
  preferred_mode: string;
}

export interface MemberEmbeddingNeighbor {
  member_id: string;
  cosine: number;
}

export interface MemberEmbeddingNode {
  member_id: string;
  x: number;
  y: number;
  document_sha256: string;
  top_neighbors: MemberEmbeddingNeighbor[];
}

export interface MemberEmbeddingShadow {
  schema_version: "member_embedding_shadow/1.0";
  space_id: string;
  model: {
    id: string;
    revision: string;
    dimensions: number;
    normalized: boolean;
  };
  input: {
    source_sha256: string;
    public_fields: string[];
    private_fields_included: false;
  };
  projection: {
    method: string;
    explained_variance_ratio: number[];
    global_distance_is_exact: false;
  };
  nodes: MemberEmbeddingNode[];
  pairs: { a: string; b: string; cosine: number }[];
}
