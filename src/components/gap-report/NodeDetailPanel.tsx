// NodeDetailPanel — 연결맵 노드 클릭 시 주체 상세(FR-GR-04).
// 근거: ARCHITECTURE.md ADR-02, TASKS.md T-018
// ConnectionMap의 선택 상태를 그대로 받아 렌더만 하는 순수 표시 컴포넌트.

import type { Organization, Region } from "@/types";
import { stageLabel } from "./lookups";
import type { MapNode } from "./map-topology";

export function NodeDetailPanel({
  node,
  region,
  orgs,
}: {
  node: MapNode | null;
  region: Region;
  orgs: Organization[];
}) {
  if (!node) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center border border-dashed border-guud-hairline p-4 text-center text-sm text-guud-text-muted-2">
        연결맵·지역 맵에서 노드를 선택하면 주체 상세가 여기 표시됩니다.
      </div>
    );
  }

  const actorCount = region.actor_counts.find(
    (row) => row.label === node.actorCountLabel,
  );
  const relatedOrgs = orgs.filter((org) =>
    node.stageIds.includes(org.value_chain_stage_id),
  );

  return (
    <div className="border border-guud-hairline p-4" aria-live="polite">
      <p className="font-heading text-lg font-bold text-foreground">
        {node.label}
      </p>
      {actorCount && (
        <p className="mt-1 text-sm text-guud-text-muted-2">
          규모 {actorCount.count}
          {actorCount.metric ? ` · ${actorCount.metric}` : ""}
        </p>
      )}

      {node.stageIds.length > 0 ? (
        <p className="mt-2 text-xs text-guud-text-muted-2">
          밸류체인 단계: {node.stageIds.map((id) => stageLabel(id)).join(", ")}
        </p>
      ) : (
        <p className="mt-2 text-xs text-guud-text-muted-2">
          이 지역 STAGE_LINK에 아직 연결된 단계가 없습니다(고립 노드).
        </p>
      )}

      <p className="mt-3 text-xs font-semibold text-guud-text-muted-2">
        확인된 조직 {relatedOrgs.length}건
      </p>
      {relatedOrgs.length > 0 ? (
        <ul className="mt-1 space-y-1">
          {relatedOrgs.slice(0, 6).map((org) => (
            <li key={org.id} className="text-sm text-foreground">
              {org.name}{" "}
              <span className="text-xs text-guud-text-muted-2">
                ({org.actor_type} · {org.region.sido} {org.region.sigungu})
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-guud-text-muted-2">
          이 지역 조직 시드에서 매칭된 항목이 없습니다.
        </p>
      )}
    </div>
  );
}
