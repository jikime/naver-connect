"use client";

// CollabRelationMap — 협업관계 온톨로지 그래프 (v3.1).
// v3.1 개선:
//  - 기본 협업신뢰도 70점 → 핵심 관계만 표시로 클러터 제거
//  - 레이어 컬럼에 그라디언트 배경 추가
//  - 엣지 굵기 = 협업 강도 시각화
//  - 클러스터 헤더에 연결 건수 뱃지
//  - 노드 크기 = 연결 수 비례 (degree)
//  - 엣지: 실제 협력은 색상 있는 실선, 잠재는 회색 점선
//  - 레이블 위치 개선 (노드 아래 고정, 배경 rect)

import { useMemo, useState } from "react";
import type { CollabRelation, Organization, SubgroupMapEntry } from "@/types";

const LAYER_LABEL = {
  A: "사회혁신활동가",
  B: "사회혁신지원가",
  C: "일반기업",
} as const;

// ── 레이아웃 상수 ─────────────────────────────────────────

const LAYER_A_GROUPS = ["A1", "A2", "A3", "A4", "A5", "A6"] as const;
const LAYER_B_GROUPS = ["B1", "B2", "B3", "B4"] as const;
const LAYER_C_GROUPS = ["C1", "C2", "C3", "C4"] as const;

const SUBGROUP_LABELS: Record<string, string> = {
  A1: "사회적기업형",
  A2: "자원순환형",
  A3: "지역밀착형",
  A4: "조합형",
  A5: "인증기업형",
  A6: "성장혁신형",
  B1: "자금공급형",
  B2: "역량강화형",
  B3: "인프라·네트워크형",
  B4: "대변·제도형",
  C1: "일반기업형",
  C2: "전문서비스파트너형",
  C3: "글로벌·대기업형",
  C4: "학계·공공·언론형",
};

// 레이어 컬러 팔레트
const LAYER = {
  A: {
    bg: "#edfaf4",
    gradFrom: "#d4f0e5",
    gradTo: "#f0fbf6",
    border: "#34a871",
    text: "#1a6b50",
    node: "#34a871",
    edge: "#34a871",
  },
  B: {
    bg: "#fff8ed",
    gradFrom: "#fde8c3",
    gradTo: "#fffcf5",
    border: "#e0982a",
    text: "#7a4f10",
    node: "#e0982a",
    edge: "#e0982a",
  },
  C: {
    bg: "#f0f3f8",
    gradFrom: "#dde3ef",
    gradTo: "#f5f7fb",
    border: "#6a82a0",
    text: "#3a4d64",
    node: "#6a82a0",
    edge: "#6a82a0",
  },
} as const;

type LayerKey = keyof typeof LAYER;

const VIEW_W = 1080;
const COL_GAP = 12;
const LAYER_PAD = 12;
const GROUP_GAP = 8;
const GROUP_HEAD = 22;
const GROUP_PAD = 10;
const NODE_BASE = 10; // 기본 반지름
const NODE_MAX = 15; // 최대 반지름 (degree 높을수록 커짐)
const NODE_ROW_H = 34; // 노드 한 행 높이
const NODES_PER_ROW = 3;
const LABEL_FONT = 8.5;
const LABEL_LINE_H = 11;
const COL_W = (VIEW_W - LAYER_PAD * 2 - COL_GAP * 2) / 3;
const COL_X = {
  A: LAYER_PAD,
  B: LAYER_PAD + COL_W + COL_GAP,
  C: LAYER_PAD + (COL_W + COL_GAP) * 2,
} as const;

// ── 타입 ─────────────────────────────────────────────────

interface NodePos {
  id: string;
  code: string;
  layer: LayerKey;
  cx: number;
  cy: number;
  r: number;
}
interface GroupBox {
  code: string;
  label: string;
  layer: LayerKey;
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
}
interface MapFilter {
  showA: boolean;
  showB: boolean;
  showC: boolean;
  onlyActual: boolean;
  minStrength: number;
}

const DEFAULT_FILTER: MapFilter = {
  showA: true,
  showB: true,
  showC: true,
  onlyActual: false,
  minStrength: 0.7,
};

// ── 레이아웃 계산 ─────────────────────────────────────────

function buildLayout(
  relations: CollabRelation[],
  filter: MapFilter,
  subgroupMap: readonly SubgroupMapEntry[],
): { nodes: NodePos[]; groups: GroupBox[]; viewH: number } {
  const codeOf = (id: string) =>
    subgroupMap.find((e) => e.org_id === id)?.subgroup_code ?? "A1";
  const layerOf = (code: string): LayerKey =>
    code[0] === "A" ? "A" : code[0] === "B" ? "B" : "C";

  // 등장 org 수집 + 레이어 필터
  const orgIdSet = new Set<string>();
  for (const r of relations) {
    orgIdSet.add(r.org_a_id);
    orgIdSet.add(r.org_b_id);
  }

  const visibleOrgs = Array.from(orgIdSet).filter((id) => {
    const l = layerOf(codeOf(id));
    if (l === "A" && !filter.showA) return false;
    if (l === "B" && !filter.showB) return false;
    if (l === "C" && !filter.showC) return false;
    return true;
  });

  // degree 집계 (연결 수)
  const degree = new Map<string, number>();
  for (const r of relations) {
    degree.set(r.org_a_id, (degree.get(r.org_a_id) ?? 0) + 1);
    degree.set(r.org_b_id, (degree.get(r.org_b_id) ?? 0) + 1);
  }
  const maxDeg = Math.max(...Array.from(degree.values()), 1);

  // 노드 반지름: degree 비례
  const nodeR = (id: string) => {
    const d = degree.get(id) ?? 1;
    return NODE_BASE + (NODE_MAX - NODE_BASE) * Math.min(d / maxDeg, 1);
  };

  // 그룹핑
  const byGroup = new Map<string, string[]>();
  for (const id of visibleOrgs) {
    const c = codeOf(id);
    const group = byGroup.get(c);
    if (group) group.push(id);
    else byGroup.set(c, [id]);
  }

  // 레이어별 배치
  function layoutLayer(
    codes: readonly string[],
    layer: LayerKey,
  ): { nodes: NodePos[]; groups: GroupBox[]; bottomY: number } {
    const nodes: NodePos[] = [];
    const groups: GroupBox[] = [];
    let y = LAYER_PAD + 24; // 레이어 타이틀 높이

    for (const code of codes) {
      const orgs = byGroup.get(code);
      if (!orgs || orgs.length === 0) continue;

      const rows = Math.ceil(orgs.length / NODES_PER_ROW);
      const boxH = GROUP_PAD * 2 + GROUP_HEAD + rows * NODE_ROW_H;

      groups.push({
        code,
        label: SUBGROUP_LABELS[code] ?? code,
        layer,
        x: COL_X[layer],
        y,
        w: COL_W,
        h: boxH,
        count: orgs.length,
      });

      orgs.forEach((id, i) => {
        const col = i % NODES_PER_ROW;
        const row = Math.floor(i / NODES_PER_ROW);
        const cellW = COL_W / NODES_PER_ROW;
        const cx = COL_X[layer] + cellW * col + cellW / 2;
        const cy = y + GROUP_PAD + GROUP_HEAD + nodeR(id) + row * NODE_ROW_H;
        nodes.push({ id, code, layer, cx, cy, r: nodeR(id) });
      });

      y += boxH + GROUP_GAP;
    }
    return { nodes, groups, bottomY: y };
  }

  const rA = layoutLayer(LAYER_A_GROUPS, "A");
  const rB = layoutLayer(LAYER_B_GROUPS, "B");
  const rC = layoutLayer(LAYER_C_GROUPS, "C");

  const viewH = Math.max(rA.bottomY, rB.bottomY, rC.bottomY) + LAYER_PAD;

  return {
    nodes: [...rA.nodes, ...rB.nodes, ...rC.nodes],
    groups: [...rA.groups, ...rB.groups, ...rC.groups],
    viewH,
  };
}

// ── 상세 패널 ─────────────────────────────────────────────

function NodeDetail({
  nodeId,
  orgs,
  relations,
  subgroupMap,
  onClose,
}: {
  nodeId: string;
  orgs: Organization[];
  relations: CollabRelation[];
  subgroupMap: readonly SubgroupMapEntry[];
  onClose: () => void;
}) {
  const org = orgs.find((o) => o.id === nodeId);
  const entry = subgroupMap.find((e) => e.org_id === nodeId);
  const code = entry?.subgroup_code ?? "";
  const layer = (code[0] as LayerKey) || "C";
  const lc = LAYER[layer];

  const connected = relations.filter(
    (r) => r.org_a_id === nodeId || r.org_b_id === nodeId,
  );
  const actual = connected.filter((r) => r.is_actual);
  const potential = connected.filter((r) => !r.is_actual);

  const partnerName = (r: CollabRelation) => {
    const pid = r.org_a_id === nodeId ? r.org_b_id : r.org_a_id;
    return orgs.find((o) => o.id === pid)?.name ?? pid;
  };

  return (
    <div className="w-60 shrink-0 overflow-hidden rounded-2xl border border-guud-hairline bg-card text-xs shadow-md">
      <div
        className="px-4 pt-3 pb-2 flex items-start justify-between gap-2"
        style={{ borderBottom: `2px solid ${lc.border}` }}
      >
        <div>
          <span
            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-black"
            style={{ background: lc.bg, color: lc.text }}
          >
            {code}
          </span>
          <p className="mt-1 font-semibold text-foreground leading-snug">
            {org?.name ?? nodeId}
          </p>
          <p className="text-guud-text-muted-2">{entry?.subgroup_label}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-guud-text-muted-2 hover:text-foreground shrink-0"
        >
          ✕
        </button>
      </div>
      {org && (
        <p className="px-4 py-1.5 text-guud-text-muted-2">
          {org.region?.sido} {org.region?.sigungu} · {org.actor_type}
        </p>
      )}
      <div className="px-4 pb-3">
        <p className="mb-1.5 font-semibold text-foreground">
          <span className="text-green-700">{actual.length}건 실제</span>
          {" · "}
          <span className="text-amber-600">{potential.length}건 잠재</span>
        </p>
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {connected
            .sort((a, b) => b.strength - a.strength)
            .map((r) => (
              <li
                key={r.id}
                className="flex items-start gap-1.5 rounded-lg border border-guud-hairline p-1.5"
              >
                <span
                  className="mt-0.5 shrink-0"
                  style={{ color: r.is_actual ? "#16a34a" : "#d97706" }}
                >
                  {r.is_actual ? "●" : "○"}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {partnerName(r)}
                  </p>
                  <p className="text-guud-text-muted-2">
                    {r.relation_type} · {Math.round(r.strength * 100)}점
                  </p>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

function EdgeDetail({
  relation,
  orgs,
  onClose,
}: {
  relation: CollabRelation;
  orgs: Organization[];
  onClose: () => void;
}) {
  const nameA =
    orgs.find((o) => o.id === relation.org_a_id)?.name ?? relation.org_a_id;
  const nameB =
    orgs.find((o) => o.id === relation.org_b_id)?.name ?? relation.org_b_id;
  const layerA = (relation.org_a_subgroup[0] as LayerKey) || "C";
  const lc = LAYER[layerA];

  return (
    <div className="w-60 shrink-0 overflow-hidden rounded-2xl border border-guud-hairline bg-card text-xs shadow-md">
      <div
        className="px-4 pt-3 pb-2 flex items-start justify-between gap-2"
        style={{ borderBottom: `2px solid ${lc.border}` }}
      >
        <p className="font-bold text-foreground">{relation.pair_code}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-guud-text-muted-2 hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-guud-text-muted-2 leading-snug">
          {nameA}
          <br />× {nameB}
        </p>
        <p className="text-foreground leading-relaxed">
          {relation.description}
        </p>
        <div className="flex flex-wrap gap-x-3 text-guud-text-muted-2 pt-0.5">
          <span>
            유형: <b className="text-foreground">{relation.relation_type}</b>
          </span>
          <span>
            신뢰도:{" "}
            <b className="text-foreground">
              {Math.round(relation.strength * 100)}점
            </b>
          </span>
        </div>
        <p>
          {relation.is_actual ? (
            <span className="font-semibold text-green-700">● 실제 협력</span>
          ) : (
            <span className="font-semibold text-amber-600">○ 잠재 협력</span>
          )}
          {relation.basis_case_id && (
            <span className="ml-2 text-guud-text-muted-2">
              근거: {relation.basis_case_id}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────

export function CollabRelationMap({
  relations,
  orgs,
  subgroupMap,
  onSelectRelation,
}: {
  relations: CollabRelation[];
  orgs: Organization[];
  subgroupMap: SubgroupMapEntry[];
  onSelectRelation?: (rel: CollabRelation | null) => void;
}) {
  const resolvedOrgs = orgs;

  const [filter, setFilter] = useState<MapFilter>(DEFAULT_FILTER);
  const [selectedNodeId, setSelNode] = useState<string | null>(null);
  const [selectedRelId, setSelRel] = useState<string | null>(null);
  const [hoveredNodeId, setHovNode] = useState<string | null>(null);
  const [hoveredRelId, setHovRel] = useState<string | null>(null);

  // 필터 적용
  const filteredRels = useMemo(
    () =>
      relations.filter((r) => {
        if (filter.onlyActual && !r.is_actual) return false;
        if (r.strength < filter.minStrength) return false;
        return true;
      }),
    [relations, filter],
  );

  const { nodes, groups, viewH } = useMemo(
    () => buildLayout(filteredRels, filter, subgroupMap),
    [filteredRels, filter, subgroupMap],
  );

  const posMap = useMemo(() => {
    const m = new Map<string, NodePos>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const orgName = (id: string) =>
    resolvedOrgs.find((o) => o.id === id)?.name ?? id;

  // 선택 핸들러
  function clickNode(id: string) {
    setSelRel(null);
    if (onSelectRelation) onSelectRelation(null);
    setSelNode((p) => (p === id ? null : id));
  }
  function clickEdge(r: CollabRelation) {
    setSelNode(null);
    if (selectedRelId === r.id) {
      setSelRel(null);
      if (onSelectRelation) onSelectRelation(null);
    } else {
      setSelRel(r.id);
      if (onSelectRelation) onSelectRelation(r);
    }
  }

  const selRelObj = relations.find((r) => r.id === selectedRelId) ?? null;
  const actualCnt = relations.filter((r) => r.is_actual).length;
  const potCnt = relations.filter((r) => !r.is_actual).length;

  if (relations.length === 0)
    return (
      <div className="flex h-32 items-center justify-center text-sm text-guud-text-muted-2">
        표시할 협업관계가 없습니다.
      </div>
    );

  return (
    <div className="space-y-3">
      {/* 통계 헤더 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <span className="font-semibold text-foreground">
          {nodes.length}개 기관 표시중
        </span>
        <span className="text-green-700">● 실제 협력 {actualCnt}건</span>
        <span className="text-amber-600">○ 잠재 협력 {potCnt}건</span>
        <span className="ml-auto text-guud-text-muted-2">
          노드·선 클릭 → 상세 정보
        </span>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-guud-hairline bg-card px-4 py-2.5 text-xs">
        {/* 레이어 토글 */}
        {[
          {
            key: "showA" as const,
            layer: "A" as const,
            label: `A ${LAYER_LABEL.A}`,
          },
          {
            key: "showB" as const,
            layer: "B" as const,
            label: `B ${LAYER_LABEL.B}`,
          },
          {
            key: "showC" as const,
            layer: "C" as const,
            label: `C ${LAYER_LABEL.C}`,
          },
        ].map(({ key, layer, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={filter[key]}
              onChange={(e) =>
                setFilter((f) => ({ ...f, [key]: e.target.checked }))
              }
              className="h-3 w-3 rounded"
            />
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: LAYER[layer].border }}
            />
            {label}
          </label>
        ))}
        <span className="mx-1 h-4 w-px bg-guud-hairline" />
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={filter.onlyActual}
            onChange={(e) =>
              setFilter((f) => ({ ...f, onlyActual: e.target.checked }))
            }
            className="h-3 w-3 rounded"
          />
          실제만
        </label>
        {/* 협업신뢰도 슬라이더 */}
        <label className="flex items-center gap-2 ml-auto">
          <span className="text-guud-text-muted-2 whitespace-nowrap">
            협업신뢰도 최소
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={filter.minStrength}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                minStrength: parseFloat(e.target.value),
              }))
            }
            className="h-1 w-24 cursor-pointer accent-primary"
            title="협업신뢰도(0~100점) 이 값 이상인 관계만 표시합니다"
          />
          <span className="w-7 text-right tabular-nums font-semibold text-foreground">
            {Math.round(filter.minStrength * 100)}
          </span>
        </label>
      </div>

      {/* 그래프 + 사이드 패널 */}
      <div className="flex gap-3 items-start">
        {/* SVG */}
        <div
          className="min-w-0 flex-1 overflow-x-auto rounded-2xl border border-guud-hairline shadow-sm"
          style={{ background: "#f4f7fb" }}
        >
          <svg
            viewBox={`0 0 ${VIEW_W} ${Math.max(viewH, 420)}`}
            style={{
              width: "100%",
              height: "auto",
              minHeight: 360,
              display: "block",
            }}
            aria-label="협업관계 그래프"
            role="img"
          >
            <defs>
              {/* 레이어별 그라디언트 */}
              {(["A", "B", "C"] as const).map((l) => (
                <linearGradient
                  key={l}
                  id={`grad-${l}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={LAYER[l].gradFrom} />
                  <stop offset="100%" stopColor={LAYER[l].gradTo} />
                </linearGradient>
              ))}
              {/* 화살표 마커 */}
              {(["A", "B", "C", "sel", "pot"] as const).map((k) => {
                const color =
                  k === "sel"
                    ? "#e0982a"
                    : k === "pot"
                      ? "#b0bec5"
                      : LAYER[k as LayerKey].edge;
                return (
                  <marker
                    key={k}
                    id={`arr-${k}`}
                    markerWidth="5"
                    markerHeight="5"
                    refX="4.5"
                    refY="2.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0,5 2.5,0 5"
                      fill={color}
                      opacity={k === "pot" ? 0.5 : 0.75}
                    />
                  </marker>
                );
              })}
            </defs>

            {/* 레이어 컬럼 배경 */}
            {(["A", "B", "C"] as const).map((l) => {
              if (
                (l === "A" && !filter.showA) ||
                (l === "B" && !filter.showB) ||
                (l === "C" && !filter.showC)
              )
                return null;
              return (
                <g key={l}>
                  <rect
                    x={COL_X[l]}
                    y={0}
                    width={COL_W}
                    height={Math.max(viewH, 420)}
                    fill={`url(#grad-${l})`}
                    rx={10}
                    opacity={0.45}
                  />
                  {/* 컬럼 제목 */}
                  <rect
                    x={COL_X[l] + 6}
                    y={6}
                    width={COL_W - 12}
                    height={18}
                    rx={5}
                    fill={LAYER[l].border}
                    opacity={0.2}
                  />
                  <text
                    x={COL_X[l] + COL_W / 2}
                    y={18.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fill={LAYER[l].text}
                    letterSpacing="0.1em"
                  >
                    {`${l}  ${LAYER_LABEL[l]} 레이어`}
                  </text>
                </g>
              );
            })}

            {/* 하위그룹 박스 */}
            {groups.map((g) => {
              const lc = LAYER[g.layer];
              // 연결된 엣지 수
              const edgeCnt = filteredRels.filter(
                (r) =>
                  subgroupMap.find((e) => e.org_id === r.org_a_id)
                    ?.subgroup_code === g.code ||
                  subgroupMap.find((e) => e.org_id === r.org_b_id)
                    ?.subgroup_code === g.code,
              ).length;

              return (
                <g key={g.code}>
                  <rect
                    x={g.x + 4}
                    y={g.y}
                    width={g.w - 8}
                    height={g.h}
                    rx={7}
                    fill="rgba(255,255,255,0.72)"
                    stroke={lc.border}
                    strokeWidth={1}
                    strokeDasharray="4 2"
                  />
                  {/* 헤더 라인 */}
                  <line
                    x1={g.x + 4}
                    y1={g.y + GROUP_HEAD}
                    x2={g.x + g.w - 4}
                    y2={g.y + GROUP_HEAD}
                    stroke={lc.border}
                    strokeWidth={0.6}
                    opacity={0.4}
                  />
                  {/* 코드 */}
                  <rect
                    x={g.x + 8}
                    y={g.y + 4}
                    width={22}
                    height={14}
                    rx={3}
                    fill={lc.border}
                    opacity={0.85}
                  />
                  <text
                    x={g.x + 19}
                    y={g.y + 14}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="900"
                    fill="#fff"
                  >
                    {g.code}
                  </text>
                  {/* 라벨 */}
                  <text
                    x={g.x + 34}
                    y={g.y + 14}
                    fontSize="8.5"
                    fontWeight="600"
                    fill={lc.text}
                  >
                    {g.label}
                  </text>
                  {/* 연결 건수 뱃지 */}
                  {edgeCnt > 0 && (
                    <g>
                      <rect
                        x={g.x + g.w - 30}
                        y={g.y + 4}
                        width={22}
                        height={14}
                        rx={7}
                        fill={lc.border}
                        opacity={0.18}
                      />
                      <text
                        x={g.x + g.w - 19}
                        y={g.y + 14}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="700"
                        fill={lc.text}
                      >
                        {edgeCnt}건
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 엣지 */}
            {filteredRels.map((r) => {
              const pA = posMap.get(r.org_a_id);
              const pB = posMap.get(r.org_b_id);
              if (!pA || !pB) return null;

              const isSel = r.id === selectedRelId;
              const isHov = r.id === hoveredRelId;

              const dx = pB.cx - pA.cx,
                dy = pB.cy - pA.cy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 2) return null;
              const ux = dx / dist,
                uy = dy / dist;
              const x1 = pA.cx + ux * (pA.r + 1);
              const y1 = pA.cy + uy * (pA.r + 1);
              const x2 = pB.cx - ux * (pB.r + 5);
              const y2 = pB.cy - uy * (pB.r + 5);

              // 같은 레이어 = 완만한 곡선, 다른 레이어 = 더 큰 호
              const sameLayer = r.org_a_subgroup[0] === r.org_b_subgroup[0];
              let d: string;
              if (sameLayer) {
                const mx = (x1 + x2) / 2,
                  my = (y1 + y2) / 2;
                const nx = -uy,
                  ny = ux;
                const c = 22;
                d = `M ${x1} ${y1} Q ${mx + nx * c} ${my + ny * c} ${x2} ${y2}`;
              } else {
                const mx = (x1 + x2) / 2,
                  my = (y1 + y2) / 2;
                const nx = -uy,
                  ny = ux;
                const c = 40;
                d = `M ${x1} ${y1} Q ${mx + nx * c} ${my + ny * c} ${x2} ${y2}`;
              }

              const layerA = r.org_a_subgroup[0] as LayerKey;
              const strokeBase = r.is_actual
                ? (LAYER[layerA]?.edge ?? "#888")
                : "#b0bec5";
              const stroke = isSel ? "#e0982a" : isHov ? "#4a90d9" : strokeBase;
              const sw = isSel ? 2.5 : isHov ? 2 : 0.8 + r.strength * 2.2; // 강도 비례 굵기
              const dash = r.is_actual ? undefined : "6 4";
              const opacity = isSel
                ? 1
                : isHov
                  ? 0.9
                  : r.is_actual
                    ? 0.55
                    : 0.35;
              const marker = isSel
                ? "arr-sel"
                : r.is_actual
                  ? `arr-${layerA}`
                  : "arr-pot";

              return (
                <g key={r.id}>
                  {/* 히트 영역 */}
                  {/* biome-ignore lint/a11y/useSemanticElements: SVG path */}
                  <path
                    d={d}
                    stroke="transparent"
                    strokeWidth={14}
                    fill="none"
                    className="cursor-pointer"
                    role="button"
                    aria-label={`${r.relation_type} 관계`}
                    tabIndex={0}
                    onClick={() => clickEdge(r)}
                    onMouseEnter={() => setHovRel(r.id)}
                    onMouseLeave={() => setHovRel(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") clickEdge(r);
                    }}
                  />
                  <path
                    d={d}
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeDasharray={dash}
                    opacity={opacity}
                    fill="none"
                    markerEnd={`url(#${marker})`}
                    className="pointer-events-none"
                  />
                </g>
              );
            })}

            {/* 노드 */}
            {nodes.map((n) => {
              const lc = LAYER[n.layer];
              const isSel = selectedNodeId === n.id;
              const isHov = hoveredNodeId === n.id;
              const r = isSel || isHov ? n.r + 2 : n.r;
              const label = orgName(n.id);
              const display =
                label.length > 12 ? `${label.slice(0, 11)}…` : label;
              const labelW = display.length * 5.4 + 4;

              return (
                // biome-ignore lint/a11y/useSemanticElements: SVG <g>
                <g
                  key={n.id}
                  className="cursor-pointer"
                  role="button"
                  aria-label={label}
                  tabIndex={0}
                  onMouseEnter={() => setHovNode(n.id)}
                  onMouseLeave={() => setHovNode(null)}
                  onClick={() => clickNode(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") clickNode(n.id);
                  }}
                >
                  {/* 후광 */}
                  {(isSel || isHov) && (
                    <circle
                      cx={n.cx}
                      cy={n.cy}
                      r={r + 5}
                      fill={lc.border}
                      opacity={0.15}
                      className="pointer-events-none"
                    />
                  )}

                  {/* 흰색 테두리 (배경과 구분) */}
                  <circle
                    cx={n.cx}
                    cy={n.cy}
                    r={r + 1.5}
                    fill="white"
                    opacity={0.7}
                    className="pointer-events-none"
                  />

                  {/* 노드 본체 */}
                  <circle
                    cx={n.cx}
                    cy={n.cy}
                    r={r}
                    fill={isSel ? lc.border : lc.node}
                    stroke={isSel ? "#fff" : lc.bg}
                    strokeWidth={1.2}
                    opacity={isSel ? 1 : isHov ? 0.95 : 0.82}
                    className="pointer-events-none"
                  />

                  {/* 서브그룹 코드 */}
                  <text
                    x={n.cx}
                    y={n.cy + 3.5}
                    textAnchor="middle"
                    fontSize="6.5"
                    fontWeight="900"
                    fill="#fff"
                    className="pointer-events-none select-none"
                  >
                    {n.code}
                  </text>

                  {/* 기관명 레이블 배경 */}
                  <rect
                    x={n.cx - labelW / 2}
                    y={n.cy + r + 3}
                    width={labelW}
                    height={LABEL_LINE_H}
                    rx={3}
                    fill="rgba(255,255,255,0.85)"
                    className="pointer-events-none"
                  />
                  {/* 기관명 */}
                  <text
                    x={n.cx}
                    y={n.cy + r + LABEL_LINE_H}
                    textAnchor="middle"
                    fontSize={LABEL_FONT}
                    fontWeight={isSel ? "700" : "500"}
                    fill={isSel ? lc.text : "#374151"}
                    className="pointer-events-none select-none"
                  >
                    {display}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 사이드 패널 */}
        {selectedNodeId && !selRelObj && (
          <NodeDetail
            nodeId={selectedNodeId}
            orgs={resolvedOrgs}
            relations={relations}
            subgroupMap={subgroupMap}
            onClose={() => setSelNode(null)}
          />
        )}
        {selRelObj && !selectedNodeId && (
          <EdgeDetail
            relation={selRelObj}
            orgs={resolvedOrgs}
            onClose={() => {
              setSelRel(null);
              if (onSelectRelation) onSelectRelation(null);
            }}
          />
        )}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-guud-text-muted-2">
        {(["A", "B", "C"] as const).map((l) => (
          <span key={l} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: LAYER[l].border }}
            />
            {`${LAYER_LABEL[l]} (${l})`}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-px w-6 border-t-2"
            style={{ borderColor: LAYER.A.edge }}
          />
          실제 협력 (선 굵기 = 신뢰도)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-6 border-t-2 border-dashed border-[#b0bec5]" />
          잠재 협력
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#34a871]" />
          노드 크기 = 연결 수
        </span>
      </div>
    </div>
  );
}
