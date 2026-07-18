"use client";

// EcosystemMap — 내 주변 생태계 진입 화면. 경량 카드 리스트(노드-엣지 다이어그램 아님, FR-EM-03).
// 근거: ARCHITECTURE.md §3(L2 EcosystemMap), TASKS.md T-011, FR-EM-01/02/03
// 격차 리포트의 ConnectionMap(SVG, T-018)과는 완전히 별개 컴포넌트다(Self-check).

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { Button } from "@/components/ui/button";
import fieldsSeed from "@/data/fields.json";
import { getEcosystemNeighbors } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { Field, MaskedMember, Organization } from "@/types";

const fields = fieldsSeed as Field[];

function fieldNames(ids: number[]): string {
  return ids
    .map((id) => fields.find((f) => f.id === id)?.name ?? `#${id}`)
    .join(", ");
}

function OrgCard({ org }: { org: Organization }) {
  return (
    <li className="space-y-1 border border-guud-hairline p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          {org.name}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-guud-text-muted-2">
          {org.actor_type}
        </span>
      </div>
      <p className="text-xs text-guud-text-muted-2">
        {org.region.sido} {org.region.sigungu} · {fieldNames(org.field_tags)}
      </p>
    </li>
  );
}

function MemberCard({ member }: { member: MaskedMember }) {
  return (
    <li className="space-y-1 border border-guud-hairline p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          {member.name}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-guud-text-muted-2">
          {member.member_type}
        </span>
      </div>
      <p className="text-xs text-guud-text-muted-2">
        {member.org.name} · {member.region.sido} {member.region.sigungu}
      </p>
      {member.visibility.public.supply_tags.length > 0 && (
        <p className="text-xs text-foreground">
          공급: {member.visibility.public.supply_tags[0]?.detail}
        </p>
      )}
    </li>
  );
}

export function EcosystemMap() {
  const vc = useViewerContext();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [members, setMembers] = useState<MaskedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: vc 객체는 selector가 매 렌더 새로 만들어 원시값(personaId/role)만 추적한다
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEcosystemNeighbors(vc)
      .then((res) => {
        if (cancelled) return;
        setOrgs(res.orgs);
        setMembers(res.members);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "생태계 정보를 불러오지 못했어요. 역할 스위처에서 기업가 또는 전문가 페르소나를 선택해주세요.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vc.personaId, vc.role]);

  if (loading) {
    return <p className="text-sm text-guud-text-muted-2">불러오는 중…</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-guud-text-muted-2">
        내 지역·분야와 겹치는 주변 조직과 이웃 회원이에요. 자세한 격차와 기회는
        격차 리포트에서, 이번 주 추천은 주간 추천에서 확인하세요.
      </p>

      <section aria-labelledby="ecosystem-orgs">
        <h2
          id="ecosystem-orgs"
          className="mb-2 font-heading text-lg font-bold text-foreground"
        >
          주변 조직 ({orgs.length})
        </h2>
        {orgs.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {orgs.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-guud-text-muted-2">
            아직 겹치는 조직이 없어요.
          </p>
        )}
      </section>

      <section aria-labelledby="ecosystem-members">
        <h2
          id="ecosystem-members"
          className="mb-2 font-heading text-lg font-bold text-foreground"
        >
          이웃 회원 ({members.length})
        </h2>
        {members.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-guud-text-muted-2">
            아직 겹치는 이웃 회원이 없어요.
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-3 border-t border-guud-hairline pt-6">
        <Button asChild>
          <Link href="/gap-report" className="inline-flex items-center gap-1.5">
            격차 리포트 보기 <ArrowRight className="size-3.5" />
            <AutomationLevelBadge frId="FR-GR-01" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            href="/recommendations"
            className="inline-flex items-center gap-1.5"
          >
            주간 추천 보러가기 <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
