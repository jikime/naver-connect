export const DATASET_DEFINITIONS = [
  { key: "collab-cases", path: "collab_cases.json", access: "core" },
  { key: "collab-relations", path: "collab_relations.json", access: "core" },
  { key: "decline-reasons", path: "decline_reasons.json", access: "core" },
  { key: "expert-services", path: "expert_services.json", access: "core" },
  { key: "field-links", path: "field_links.json", access: "core" },
  { key: "fields", path: "fields.json", access: "core" },
  {
    key: "financial-products",
    path: "financial_products.json",
    access: "core",
  },
  { key: "five-forces", path: "five_forces.json", access: "core" },
  { key: "gap-cards", path: "gap_cards.json", access: "core" },
  { key: "interview-scripts", path: "interview_scripts.json", access: "core" },
  { key: "kpis", path: "kpis.json", access: "core" },
  { key: "meetups", path: "meetups.json", access: "core" },
  { key: "members", path: "members.json", access: "core" },
  { key: "opportunities", path: "opportunities.json", access: "core" },
  { key: "organizations", path: "organizations.json", access: "core" },
  { key: "impact-intents", path: "people/impact_intents.json", access: "core" },
  { key: "capability-offers", path: "people/offers.json", access: "core" },
  { key: "project-proposals", path: "project_proposals.json", access: "core" },
  { key: "region-hanbit", path: "region_hanbit.json", access: "core" },
  { key: "resources", path: "resources.json", access: "core" },
  { key: "stage-links", path: "stage_links.json", access: "core" },
  { key: "subgroup-map", path: "subgroup_map.json", access: "core" },
  { key: "tags", path: "tags.json", access: "core" },
  { key: "vc-stages", path: "vc_stages.json", access: "core" },
  {
    key: "vocabulary-role-terms",
    path: "vocabulary/releases/role-terms-1.0.0.json",
    access: "core",
  },
  {
    key: "member-embedding-shadow",
    path: "people/derived/member-embedding-shadow.json",
    access: "private",
  },
  {
    key: "members-private-redacted",
    path: "people/derived/members-private.redacted.json",
    access: "private",
  },
  {
    key: "recommendations-redacted",
    path: "people/derived/recommendations.redacted.json",
    access: "private",
  },
  { key: "deal-rooms", path: "private/deal_rooms.json", access: "private" },
  { key: "match-scores", path: "private/match_scores.json", access: "private" },
  {
    key: "members-private",
    path: "private/members-private.json",
    access: "private",
  },
  {
    key: "people-consents",
    path: "private/people/consents.json",
    access: "private",
  },
  { key: "people-needs", path: "private/people/needs.json", access: "private" },
  {
    key: "recommendations-private",
    path: "private/recommendations.json",
    access: "private",
  },
  {
    key: "vocabulary-change-events",
    path: "vocabulary/vocabulary-change-events.jsonl",
    access: "private",
  },
] as const;

export type DatasetDefinition = (typeof DATASET_DEFINITIONS)[number];
export type DatasetKey = DatasetDefinition["key"];
export type DatasetAccess = DatasetDefinition["access"];

const definitionsByKey = new Map<DatasetKey, DatasetDefinition>(
  DATASET_DEFINITIONS.map((definition) => [definition.key, definition]),
);

export function getDatasetDefinition(
  key: string,
): DatasetDefinition | undefined {
  return definitionsByKey.get(key as DatasetKey);
}
