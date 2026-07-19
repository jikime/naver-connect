"use client";

// CollabCasesView — 협업 사례 입력·조회 + 시뮬레이션(FR-CS-01/02).
// 근거: ARCHITECTURE.md §5.2/§5.3, PRD §8.16, TASKS #28
// 입력은 세션 스토어 한정(inputCollabCase, C-3/A8) — 새로고침 시 시드로 리셋(A6).

import { useEffect, useState } from "react";
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
import organizationsSeed from "@/data/organizations.json";
import { getCollabCases, inputCollabCase, simulateCollab } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { CollabCase, Field, Organization } from "@/types";

const fields = fieldsSeed as Field[];
const organizations = organizationsSeed as Organization[];

function fieldName(id: number): string {
  return fields.find((f) => f.id === id)?.name ?? `#${id}`;
}

function orgName(id: string): string {
  return organizations.find((o) => o.id === id)?.name ?? id;
}

function CaseCard({ collabCase }: { collabCase: CollabCase }) {
  return (
    <li className="border border-guud-hairline p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {collabCase.title}
        </p>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-guud-text-muted-2">
          {collabCase.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-guud-text-muted-2">
        {collabCase.participant_org_ids.map(orgName).join(" × ")} ·{" "}
        {collabCase.period}
      </p>
      <p className="mt-1 text-sm text-foreground">
        {collabCase.outcome_summary}
      </p>
      <p className="mt-1 text-xs text-guud-text-muted-2">
        분야: {collabCase.field_tags.map(fieldName).join(", ")} · 입력:{" "}
        {collabCase.input_by}
      </p>
    </li>
  );
}

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
    const res = await simulateCollab(vc, id);
    setResult(res);
    setLoading(false);
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
          우리 조직(또는 특정 대상)을 선택하면 공유 분야가 많은 순으로 가능한
          협업 조합 후보와 유사 사례를 보여줍니다.
        </p>
        <Select value={orgId} onValueChange={runSimulation}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="기준 조직 선택" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading && <p className="text-sm text-guud-text-muted-2">계산 중…</p>}

        {result && !loading && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-guud-text-muted-2">
                협업 후보
              </p>
              {result.candidates.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {result.candidates.map((c) => (
                    <li
                      key={c.org.id}
                      className="border border-guud-hairline px-2 py-1 text-xs"
                    >
                      <span className="font-semibold text-foreground">
                        {c.org.name}
                      </span>
                      <p className="text-guud-text-muted-2">{c.rationale}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-guud-text-muted-2">
                  공유 분야가 있는 후보가 없습니다.
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-guud-text-muted-2">
                유사 사례
              </p>
              {result.similarCases.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {result.similarCases.map((c) => (
                    <li key={c.id} className="text-xs text-foreground">
                      {c.title}{" "}
                      <span className="text-guud-text-muted-2">
                        ({c.status})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-guud-text-muted-2">
                  유사 사례가 없습니다.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
          (id) => organizations.find((o) => o.id === id)?.field_tags ?? [],
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
          <Label>참여 조직(2곳 이상)</Label>
          <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto border border-guud-hairline p-2">
            {organizations.map((org) => (
              <li key={org.id} className="flex items-center gap-2">
                <Checkbox
                  id={`cc-org-${org.id}`}
                  checked={participantIds.includes(org.id)}
                  onCheckedChange={() => toggleParticipant(org.id)}
                />
                <Label
                  htmlFor={`cc-org-${org.id}`}
                  className="text-xs font-normal"
                >
                  {org.name}
                </Label>
              </li>
            ))}
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
          입력(세션 반영)
        </Button>
      </CardContent>
    </Card>
  );
}

export function CollabCasesView() {
  const vc = useViewerContext();
  const [cases, setCases] = useState<CollabCase[]>([]);
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: vc는 selector 원시값(personaId)만 추적
  useEffect(() => {
    let cancelled = false;
    getCollabCases(vc).then((result) => {
      if (!cancelled) {
        setCases(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vc.personaId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section aria-labelledby="collab-cases-heading">
        <h2
          id="collab-cases-heading"
          className="mb-2 font-heading text-lg font-bold text-foreground"
        >
          협업 사례 ({loading ? "…" : cases.length})
        </h2>
        {loading ? (
          <p className="text-sm text-guud-text-muted-2">불러오는 중…</p>
        ) : (
          <ul className="space-y-2">
            {cases.map((c) => (
              <CaseCard key={c.id} collabCase={c} />
            ))}
          </ul>
        )}
      </section>

      <div className="space-y-6">
        <SimulationPanel />
        <InputForm onAdded={(c) => setCases((prev) => [...prev, c])} />
      </div>
    </div>
  );
}
