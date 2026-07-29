"use client";

// CollabCasesView — 협업 사례 입력·조회 + 시뮬레이션 + 협업관계 그래프 (FR-CS-01/02, v1.3).
// 근거: ARCHITECTURE.md §5.2/§5.3, PRD §8.16, TASKS #28
// v1.2: CollabRelationMap(그래프), CollabPatternPanel(패턴 분석), 시뮬레이션 강화 통합.
// v1.3: initialCases/initialRelations/initialOrgs props 수용 (Server Component에서 DB 데이터 전달).

import { useState } from "react";
import { CollabPatternPanel } from "@/components/collaboration/CollabPatternPanel";
import { CollabRelationMap } from "@/components/collaboration/CollabRelationMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import fieldsSeed from "@/data/fields.json";
import organizationsSeedFallback from "@/data/organizations.json";
import subgroupMapSeed from "@/data/subgroup_map.json";
import {
  getSubgroupCode,
  inputCollabCase,
  SUBGROUP_KIND_COLOR,
  SUBGROUP_KIND_LABEL,
  simulateCollab,
} from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type {
  CollabCase,
  CollabRelation,
  Field,
  Organization,
  SubgroupMapEntry,
} from "@/types";

const fields = fieldsSeed as Field[];
const subgroupMap = subgroupMapSeed as SubgroupMapEntry[];

// ──────────────────────────────────────────────
// 유틸 — 색상/라벨은 src/lib/dal/collaboration.ts의 단일 소스를 공유한다.
// ──────────────────────────────────────────────

const SUBGROUP_KIND_BG: Record<string, string> = {
  "non-social": "#eef0f2",
  supporter: "#fbf1e3",
  activist: "#e6f1f4",
};

function fieldName(id: number): string {
  return fields.find((f) => f.id === id)?.name ?? `#${id}`;
}

// orgName은 메인 뷰 props로부터 주입된 orgs를 참조한다.
// 컴포넌트 외부에서는 fallback으로 JSON 시드 사용.
const fallbackOrgs = organizationsSeedFallback as Organization[];
let _resolvedOrgs: Organization[] = fallbackOrgs;

function orgName(id: string): string {
  return _resolvedOrgs.find((o) => o.id === id)?.name ?? id;
}

function SubgroupBadge({ orgId }: { orgId: string }) {
  const code = getSubgroupCode(orgId);
  const entry = subgroupMap.find((e) => e.org_id === orgId);
  if (!code || !entry) return null;
  const bg = SUBGROUP_KIND_BG[entry.kind] ?? "#eef0f2";
  const color = SUBGROUP_KIND_COLOR[entry.kind] ?? "#6b7686";
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
      style={{ background: bg, color }}
      title={`${code} · ${entry.subgroup_label} (${SUBGROUP_KIND_LABEL[entry.kind]})`}
    >
      {code}
    </span>
  );
}

// ──────────────────────────────────────────────
// 협업사례 카드
// ──────────────────────────────────────────────

function CaseCard({ collabCase }: { collabCase: CollabCase }) {
  return (
    <li className="rounded-2xl border border-guud-hairline bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {collabCase.title}
        </p>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
            collabCase.status === "완료"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {collabCase.status}
        </span>
      </div>
      {/* 참여 조직 + 하위그룹 뱃지 */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-guud-text-muted-2">
        {collabCase.participant_org_ids.map((id, idx) => (
          <span key={id} className="flex items-center gap-1">
            {idx > 0 && <span className="text-guud-text-muted-2">×</span>}
            <SubgroupBadge orgId={id} />
            <span>{orgName(id)}</span>
          </span>
        ))}
        <span className="ml-1 text-guud-text-muted-2">
          · {collabCase.period}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">
        {collabCase.outcome_summary}
      </p>
      <p className="mt-1 text-xs text-guud-text-muted-2">
        분야: {collabCase.field_tags.map(fieldName).join(", ")} ·{" "}
        {collabCase.input_by}
      </p>
    </li>
  );
}

// ──────────────────────────────────────────────
// 협업관계 상세 패널 (선택된 엣지 정보)
// ──────────────────────────────────────────────

function RelationDetailPanel({ relation }: { relation: CollabRelation }) {
  const strengthPct = Math.round(relation.strength * 100);
  return (
    <div className="mt-3 rounded-xl border border-guud-hairline bg-card p-3 text-xs">
      <p className="font-semibold text-foreground">{relation.pair_code}</p>
      <p className="mt-0.5 text-guud-text-muted-2">
        {orgName(relation.org_a_id)} × {orgName(relation.org_b_id)}
      </p>
      <p className="mt-1 font-medium text-foreground">{relation.description}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-guud-text-muted-2">
        <span>
          유형: <b className="text-foreground">{relation.relation_type}</b>
        </span>
        <span>
          강도: <b className="text-foreground">{strengthPct}점</b>
        </span>
        <span>
          {relation.is_actual ? (
            <span className="text-green-700">● 실제 협력</span>
          ) : (
            <span className="text-amber-600">○ 잠재 협력</span>
          )}
        </span>
      </div>
      <p className="mt-1 text-guud-text-muted-2">
        분야: {relation.domain_tags.map(fieldName).join(", ")}
        {relation.basis_case_id && <> · 근거: {relation.basis_case_id}</>}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// 시뮬레이션 패널
// ──────────────────────────────────────────────

function SimulationPanel() {
  const vc = useViewerContext();
  const [orgId, setOrgId] = useState<string>("");
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof simulateCollab>
  > | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSimulation(id: string) {
    setOrgId(id);
    setLoading(true);
    try {
      const res = await simulateCollab(vc, id);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="ring-1 ring-border">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal">
          협업 시뮬레이션
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-guud-text-muted-2">
          기준 조직을 선택하면 공유 분야·하위그룹 친화도·구매력을 복합 점수로
          산출해 협업 후보를 제시합니다.
        </p>
        <Select value={orgId} onValueChange={runSimulation}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="기준 조직 선택" />
          </SelectTrigger>
          <SelectContent>
            {_resolvedOrgs.map((org) => {
              const code = getSubgroupCode(org.id);
              return (
                <SelectItem key={org.id} value={org.id}>
                  {code ? `[${code}] ` : ""}
                  {org.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {loading && <p className="text-sm text-guud-text-muted-2">계산 중…</p>}

        {result && !loading && (
          <div className="space-y-4">
            {result.baseSubgroupCode && (
              <p className="text-xs text-guud-text-muted-2">
                기준 조직 하위그룹:{" "}
                <b className="text-foreground">{result.baseSubgroupCode}</b>
              </p>
            )}

            <div>
              <p className="mb-1.5 text-xs font-semibold text-guud-text-muted-2">
                협업 후보 (종합 점수순)
              </p>
              {result.candidates.length > 0 ? (
                <ul className="space-y-1.5">
                  {result.candidates.map((c) => (
                    <li
                      key={c.org.id}
                      className="rounded-lg border border-guud-hairline px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <SubgroupBadge orgId={c.org.id} />
                          <span className="text-xs font-semibold text-foreground">
                            {c.org.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {c.existingRelation && (
                            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                              기존협력
                            </span>
                          )}
                          <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
                            {c.compositeScore}점
                          </span>
                        </div>
                      </div>
                      <p className="mt-0.5 text-[11px] text-guud-text-muted-2">
                        {c.rationale}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-guud-text-muted-2">
                  협업 가능한 후보가 없습니다.
                </p>
              )}
            </div>

            {result.similarCases.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-guud-text-muted-2">
                  유사 사례
                </p>
                <ul className="space-y-0.5">
                  {result.similarCases.map((c) => (
                    <li key={c.id} className="text-xs text-foreground">
                      {c.title}{" "}
                      <span className="text-guud-text-muted-2">
                        ({c.status})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// 사례 입력 폼
// ──────────────────────────────────────────────

function InputForm({ onAdded }: { onAdded: (c: CollabCase) => void }) {
  const vc = useViewerContext();
  const [title, setTitle] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [period, setPeriod] = useState("");
  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState<CollabCase["status"]>("진행중");
  const [submitting, setSubmitting] = useState(false);

  function toggleParticipant(id: string) {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    if (!title || participantIds.length < 2 || !period || !outcome) return;
    setSubmitting(true);
    const fieldTags = Array.from(
      new Set(
        participantIds.flatMap(
          (id) => _resolvedOrgs.find((o) => o.id === id)?.field_tags ?? [],
        ),
      ),
    );
    const created = await inputCollabCase(vc, {
      title,
      status,
      participant_org_ids: participantIds,
      period,
      outcome_summary: outcome,
      field_tags: fieldTags,
    });
    onAdded(created);
    setTitle("");
    setParticipantIds([]);
    setPeriod("");
    setOutcome("");
    setSubmitting(false);
  }

  return (
    <Card className="ring-1 ring-border">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal">
          협업 사례 입력
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="cc-title">제목</Label>
          <Input
            id="cc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: OO조합 × OO조합 협업"
          />
        </div>
        <div>
          <Label>참여 조직 (2곳 이상)</Label>
          <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-guud-hairline p-2">
            {_resolvedOrgs.map((org) => {
              const code = getSubgroupCode(org.id);
              return (
                <li key={org.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`cc-org-${org.id}`}
                    checked={participantIds.includes(org.id)}
                    onCheckedChange={() => toggleParticipant(org.id)}
                  />
                  <Label
                    htmlFor={`cc-org-${org.id}`}
                    className="flex items-center gap-1.5 text-xs font-normal"
                  >
                    {code && (
                      <span className="text-[10px] font-bold text-guud-text-muted-2">
                        [{code}]
                      </span>
                    )}
                    {org.name}
                  </Label>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <Label htmlFor="cc-period">기간</Label>
          <Input
            id="cc-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="예: 2026-07 ~ (진행중)"
          />
        </div>
        <div>
          <Label htmlFor="cc-outcome">성과 요약</Label>
          <Textarea
            id="cc-outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as CollabCase["status"])}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="진행중">진행중</SelectItem>
            <SelectItem value="완료">완료</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          disabled={
            submitting ||
            !title ||
            participantIds.length < 2 ||
            !period ||
            !outcome
          }
          onClick={handleSubmit}
        >
          사례 입력
        </Button>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// 탭 정의
// ──────────────────────────────────────────────

type Tab = "graph" | "cases" | "patterns" | "simulate";

const TABS: { id: Tab; label: string }[] = [
  { id: "graph", label: "관계 그래프" },
  { id: "cases", label: "협업 사례" },
  { id: "patterns", label: "패턴 분석" },
  { id: "simulate", label: "시뮬레이션" },
];

// ──────────────────────────────────────────────
// 메인 뷰
// ──────────────────────────────────────────────

interface CollabCasesViewProps {
  initialCases?: CollabCase[];
  initialRelations?: CollabRelation[];
  initialOrgs?: Organization[];
}

export function CollabCasesView({
  initialCases = [],
  initialRelations = [],
  initialOrgs = fallbackOrgs,
}: CollabCasesViewProps) {
  // 전달된 orgs를 module-level 조회 함수에 주입
  _resolvedOrgs = initialOrgs.length > 0 ? initialOrgs : fallbackOrgs;

  const vc = useViewerContext();
  const [activeTab, setActiveTab] = useState<Tab>("graph");
  const [cases, setCases] = useState<CollabCase[]>(initialCases);
  const [relations, setRelations] =
    useState<CollabRelation[]>(initialRelations);
  const [showPotential, setShowPotential] = useState(false);
  const [selectedRelation, setSelectedRelation] =
    useState<CollabRelation | null>(null);

  void vc; // useViewerContext는 세션 write용으로 하위 컴포넌트(InputForm, SimulationPanel)에서 사용

  const displayedRelations = showPotential
    ? relations
    : relations.filter((r) => r.is_actual);

  const actualCount = relations.filter((r) => r.is_actual).length;
  const potentialCount = relations.filter((r) => !r.is_actual).length;

  return (
    <div className="space-y-6">
      {/* 탭 */}
      <div className="flex gap-0 border-b border-guud-hairline">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`mr-5 border-b-2 pb-2 pt-1 font-mono text-xs font-medium tracking-[0.1em] uppercase transition-colors ${
              activeTab === tab.id
                ? "border-foreground text-foreground"
                : "border-transparent text-guud-text-muted-2 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <>
        {/* 관계 그래프 탭 */}
        {activeTab === "graph" && (
          <div className="space-y-4">
            {/* 통계 요약 */}
            <div className="flex flex-wrap gap-4">
              <div className="rounded-xl border border-guud-hairline bg-card px-4 py-2.5">
                <p className="text-xs text-guud-text-muted-2">실제 협력</p>
                <p className="text-2xl font-bold text-foreground">
                  {actualCount}
                  <span className="ml-1 text-sm font-normal text-guud-text-muted-2">
                    건
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-guud-hairline bg-card px-4 py-2.5">
                <p className="text-xs text-guud-text-muted-2">잠재 협력</p>
                <p className="text-2xl font-bold text-foreground">
                  {potentialCount}
                  <span className="ml-1 text-sm font-normal text-guud-text-muted-2">
                    건
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-guud-hairline bg-card px-4 py-2.5">
                <p className="text-xs text-guud-text-muted-2">사례 수</p>
                <p className="text-2xl font-bold text-foreground">
                  {cases.length}
                  <span className="ml-1 text-sm font-normal text-guud-text-muted-2">
                    건
                  </span>
                </p>
              </div>
            </div>

            {/* 잠재 협력 토글 */}
            <div className="flex cursor-pointer items-center gap-2 text-sm text-guud-text-muted-2">
              <Checkbox
                checked={showPotential}
                onCheckedChange={(v) => setShowPotential(v === true)}
                id="show-potential"
              />
              <Label
                htmlFor="show-potential"
                className="cursor-pointer font-normal"
              >
                잠재 협력 관계도 표시
              </Label>
            </div>

            <CollabRelationMap
              relations={displayedRelations}
              orgs={initialOrgs}
              onSelectRelation={setSelectedRelation}
            />

            {selectedRelation && (
              <RelationDetailPanel relation={selectedRelation} />
            )}
          </div>
        )}

        {/* 협업 사례 탭 */}
        {activeTab === "cases" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section>
              <h2 className="mb-3 flex flex-wrap items-baseline gap-x-2 font-heading text-xl font-light tracking-tight text-foreground">
                협업 사례
                <span className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
                  [ {cases.length} ]
                </span>
              </h2>
              <ul className="space-y-2">
                {cases.map((c) => (
                  <CaseCard key={c.id} collabCase={c} />
                ))}
              </ul>
            </section>
            <InputForm onAdded={(c) => setCases((prev) => [...prev, c])} />
          </div>
        )}

        {/* 패턴 분석 탭 */}
        {activeTab === "patterns" && (
          <div className="space-y-4">
            <p className="text-sm text-guud-text-muted-2">
              실제 협력 관계 기준으로 하위그룹 쌍(예: A5 × A4)이 얼마나 자주
              협업하는지, 어떤 관계 유형이 많은지 분석합니다.
            </p>
            <div className="rounded-2xl border border-guud-hairline bg-card p-4">
              <h3 className="mb-3 font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
                실제 협력 패턴
              </h3>
              <CollabPatternPanel onlyActual={true} />
            </div>
            <div className="rounded-2xl border border-guud-hairline bg-card p-4">
              <h3 className="mb-3 font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
                전체 패턴 (잠재 포함)
              </h3>
              <CollabPatternPanel onlyActual={false} />
            </div>
          </div>
        )}

        {/* 시뮬레이션 탭 */}
        {activeTab === "simulate" && (
          <div className="max-w-lg">
            <SimulationPanel />
          </div>
        )}
      </>
    </div>
  );
}
