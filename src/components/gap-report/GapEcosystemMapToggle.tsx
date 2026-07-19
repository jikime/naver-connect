"use client";

// GapEcosystemMapToggle — 연결맵(그래프)과 지역 맵(구역 지도) 토글(T-020).
// 근거: TASKS.md T-020(격차 리포트 지역 맵 뷰) — "기존 연결맵과 토글"
// 두 뷰가 노드 선택 상태(selectedId)와 NodeDetailPanel을 공유해, 어느 뷰에서 노드를
// 클릭해도 같은 주체 상세가 뜬다(FR-GR-04는 뷰에 무관하게 유지).
// 토글 UI는 /knowledge-graph의 2D/3D 스위치(KnowledgeGraphView.tsx)와 동일한
// fieldset + shadcn Button 패턴을 그대로 따라 앱 전반의 "뷰 전환" 관용구를 통일한다.

import { Map as MapIcon, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Organization, Region, StageLink } from "@/types";
import { ConnectionMap } from "./ConnectionMap";
import { DistrictMapView } from "./DistrictMapView";
import {
  computeMemberNodeIds,
  computeNodeBuyingPower,
  MAP_NODES,
} from "./map-topology";
import { NodeDetailPanel } from "./NodeDetailPanel";

type MapView = "graph" | "district";

export function GapEcosystemMapToggle({
  region,
  stageLinks,
  orgs,
}: {
  region: Region;
  stageLinks: StageLink[];
  orgs: Organization[];
}) {
  const [view, setView] = useState<MapView>("graph");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const memberNodeIds = useMemo(() => computeMemberNodeIds(orgs), [orgs]);
  const buyingPowerByNode = useMemo(() => computeNodeBuyingPower(orgs), [orgs]);

  function selectNode(id: string) {
    setSelectedId((current) => (current === id ? null : id));
  }

  const selectedNode = selectedId
    ? (MAP_NODES.find((n) => n.id === selectedId) ?? null)
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-3">
        <fieldset
          className="m-0 inline-flex min-w-0 overflow-hidden border border-border p-0"
          aria-label="맵 뷰 전환"
        >
          <Button
            type="button"
            variant={view === "graph" ? "default" : "ghost"}
            size="sm"
            aria-pressed={view === "graph"}
            onClick={() => setView("graph")}
            className="gap-1.5 rounded-none border-0"
          >
            <Waypoints className="size-4" aria-hidden />
            연결맵
          </Button>
          <Button
            type="button"
            variant={view === "district" ? "default" : "ghost"}
            size="sm"
            aria-pressed={view === "district"}
            onClick={() => setView("district")}
            className="gap-1.5 rounded-none border-0"
          >
            <MapIcon className="size-4" aria-hidden />
            지역 맵
          </Button>
        </fieldset>

        {view === "graph" ? (
          <ConnectionMap
            region={region}
            stageLinks={stageLinks}
            memberNodeIds={memberNodeIds}
            buyingPowerByNode={buyingPowerByNode}
            selectedId={selectedId}
            onSelectNode={selectNode}
          />
        ) : (
          <DistrictMapView
            region={region}
            stageLinks={stageLinks}
            memberNodeIds={memberNodeIds}
            buyingPowerByNode={buyingPowerByNode}
            selectedId={selectedId}
            onSelectNode={selectNode}
          />
        )}
      </div>

      <NodeDetailPanel node={selectedNode} region={region} orgs={orgs} />
    </div>
  );
}
