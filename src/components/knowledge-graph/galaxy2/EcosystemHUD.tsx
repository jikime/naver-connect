"use client";

import { Activity, Building, Orbit, Users, Zap } from "lucide-react";
import type { GalaxyStats } from "./types";

export function EcosystemHUD({ stats }: { stats: GalaxyStats }) {
  const memberCount =
    stats.classCounts.find((c) => c.classKey === "member")?.count || 0;
  const orgCount =
    stats.classCounts.find((c) => c.classKey === "org")?.count || 0;

  return (
    <>
      {/* Mobile: compact stat chips */}
      <div className="md:hidden absolute top-3 inset-x-3 z-30 pointer-events-none">
        <div className="flex gap-2 overflow-x-auto pointer-events-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-card/60 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs whitespace-nowrap">
            <Activity className="w-3 h-3 text-muted-foreground" /> 실제{" "}
            <b className="font-mono">{stats.realCount.toLocaleString()}</b>
          </span>
          <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary/15 backdrop-blur-md border border-primary/30 px-3 py-1.5 text-xs text-primary whitespace-nowrap">
            <Zap className="w-3 h-3" /> 잠재{" "}
            <b className="font-mono">{stats.potentialCount.toLocaleString()}</b>
          </span>
          <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-card/60 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs whitespace-nowrap">
            핫 리드 <b className="font-mono">{stats.hotLeadCount}</b>
          </span>
          <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-card/60 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs whitespace-nowrap">
            <Users className="w-3 h-3 text-muted-foreground" /> {memberCount}
          </span>
          <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-card/60 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs whitespace-nowrap">
            <Building className="w-3 h-3 text-muted-foreground" /> {orgCount}
          </span>
        </div>
      </div>

      {/* Desktop: full HUD cards */}
      <div className="hidden md:block absolute left-6 top-6 w-72 space-y-4 pointer-events-none z-30">
        <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl pointer-events-auto">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Orbit className="w-4 h-4" /> 생태계 현황
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                총 연결 (Real)
              </span>
              <div className="text-2xl font-light text-foreground">
                {stats.realCount.toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-primary uppercase tracking-wider">
                잠재 연결 (Potential)
              </span>
              <div className="text-2xl font-light text-primary">
                {stats.potentialCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-3 h-3" /> 멤버
              </span>
              <span className="font-mono">{memberCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Building className="w-3 h-3" /> 조직
              </span>
              <span className="font-mono">{orgCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 backdrop-blur-md border border-primary/20 rounded-xl p-4 shadow-xl pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> 핫 리드
            </h3>
            <span className="text-xs font-mono text-primary bg-primary/20 px-1.5 py-0.5 rounded">
              {stats.hotLeadCount}
            </span>
          </div>
          <p className="text-xs text-primary/80 leading-relaxed">
            높은 전환 확률이 감지된 연결 기회가 발견되었습니다. 추천 탭에서
            확인하세요.
          </p>
        </div>

        <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl pointer-events-auto">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> 핵심 허브 노드
          </h3>
          <div className="space-y-2">
            {stats.topConnected.slice(0, 3).map((node, i) => (
              <div
                key={node.id}
                className="flex justify-between items-center text-xs"
              >
                <span className="truncate max-w-[150px] text-foreground/80">
                  {i + 1}. {node.label}
                </span>
                <span className="font-mono text-muted-foreground">
                  {node.degree}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
