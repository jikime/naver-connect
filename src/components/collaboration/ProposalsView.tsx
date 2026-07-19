"use client";

// ProposalsView — 프로젝트 제안·트래킹(FR-PP-01/02).
// 근거: ARCHITECTURE.md §5.2/§5.3, PRD §8.17, TASKS #28
// 상태 전이(제안됨→검토→성사/중단)는 세션 스토어 한정(trackProposal, C-3/A8).

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMembers, getProposals, trackProposal } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { ProjectProposal } from "@/types";

const TRACK_STATUSES: ProjectProposal["track_status"][] = [
  "제안됨",
  "검토",
  "성사",
  "중단",
];

const NEXT_STATUS: Record<
  ProjectProposal["track_status"],
  ProjectProposal["track_status"] | null
> = {
  제안됨: "검토",
  검토: "성사",
  성사: null,
  중단: null,
};

function ProposalCard({
  proposal,
  memberNames,
  onAdvance,
  onStop,
}: {
  proposal: ProjectProposal;
  memberNames: Map<string, string>;
  onAdvance: (id: string, next: ProjectProposal["track_status"]) => void;
  onStop: (id: string) => void;
}) {
  const next = NEXT_STATUS[proposal.track_status];
  return (
    <Card className="ring-1 ring-border">
      <CardHeader>
        <CardTitle className="text-sm normal-case tracking-normal">
          {proposal.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="text-guud-text-muted-2">
          근거: {proposal.basis.type} ·{" "}
          {proposal.basis.type === "생태계맵" ? (
            <Link
              href="/gap-report"
              className="underline-offset-2 hover:underline"
            >
              {proposal.basis.ref}
            </Link>
          ) : (
            <Link
              href="/collab-cases"
              className="underline-offset-2 hover:underline"
            >
              {proposal.basis.ref}
            </Link>
          )}
        </p>
        <p className="text-foreground">
          참여:{" "}
          {proposal.participant_member_ids
            .map((id) => memberNames.get(id) ?? id)
            .join(", ")}
        </p>
        <p className="text-foreground">{proposal.expected_effect}</p>
        <div className="flex flex-wrap items-center gap-2">
          {proposal.has_policy_program && (
            <Badge className="rounded-full border border-border px-2 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
              정책사업 연계
            </Badge>
          )}
          {proposal.linked_deal_id && (
            <Link
              href="/deal-rooms"
              className="text-foreground underline-offset-2 hover:underline"
            >
              딜룸 {proposal.linked_deal_id} →
            </Link>
          )}
        </div>
        {(next || proposal.track_status !== "중단") && (
          <div className="flex gap-2 border-t border-guud-hairline pt-2">
            {next && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => onAdvance(proposal.id, next)}
              >
                {next}(으)로 이동
              </Button>
            )}
            {proposal.track_status !== "성사" &&
              proposal.track_status !== "중단" && (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => onStop(proposal.id)}
                >
                  중단
                </Button>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProposalsView() {
  const vc = useViewerContext();
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [memberNames, setMemberNames] = useState<Map<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: vc는 selector 원시값(personaId)만 추적
  useEffect(() => {
    let cancelled = false;
    Promise.all([getProposals(vc), getMembers(vc)]).then(([props, members]) => {
      if (cancelled) return;
      setProposals(props);
      setMemberNames(new Map(members.map((m) => [m.id, m.name])));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [vc.personaId]);

  const grouped = useMemo(() => {
    const map = new Map<ProjectProposal["track_status"], ProjectProposal[]>();
    for (const status of TRACK_STATUSES) map.set(status, []);
    for (const p of proposals) map.get(p.track_status)?.push(p);
    return map;
  }, [proposals]);

  async function updateStatus(
    id: string,
    status: ProjectProposal["track_status"],
  ) {
    await trackProposal(vc, id, status);
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, track_status: status } : p)),
    );
  }

  if (loading) {
    return <p className="text-sm text-guud-text-muted-2">불러오는 중…</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TRACK_STATUSES.map((status) => (
        <div key={status} className="space-y-3">
          <h2 className="border-b border-guud-hairline pb-2 font-heading text-sm font-bold text-foreground">
            {status} ({grouped.get(status)?.length ?? 0})
          </h2>
          <div className="space-y-3">
            {(grouped.get(status) ?? []).map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                memberNames={memberNames}
                onAdvance={updateStatus}
                onStop={(id) => updateStatus(id, "중단")}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
