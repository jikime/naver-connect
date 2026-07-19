"use client";

// MyOrgsPanel — "내 소속 단체 / 내가 대상으로 하는 단체" 설정 + 종합 뷰(FR-EM2-03).
// 근거: ARCHITECTURE.md §5.2/§5.3, PRD §8.15, TASKS #28
// 소속/대상 설정은 세션 한정(setMyOrgs, C-3/A8) — 새로고침 시 회원 시드 기본값으로 복귀한다.

import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCollabCases, getMyOrgs, setMyOrgs } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { CollabCase, Organization } from "@/types";

export function MyOrgsPanel({ orgs }: { orgs: Organization[] }) {
  const vc = useViewerContext();
  const [affiliationId, setAffiliationId] = useState<string | null>(null);
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [collabCases, setCollabCases] = useState<CollabCase[]>([]);
  const [loaded, setLoaded] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: vc는 selector 원시값(personaId)만 추적
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    Promise.all([getMyOrgs(vc), getCollabCases(vc)]).then(([mine, cases]) => {
      if (cancelled) return;
      setAffiliationId(mine.affiliationOrgId);
      setTargetIds(mine.targetOrgIds);
      setCollabCases(cases);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [vc.personaId]);

  const orgById = useMemo(() => new Map(orgs.map((o) => [o.id, o])), [orgs]);
  const affiliationOrg = affiliationId ? orgById.get(affiliationId) : undefined;

  function updateAffiliation(id: string) {
    setAffiliationId(id);
    void setMyOrgs(vc, id, targetIds);
  }

  function toggleTarget(id: string) {
    const next = targetIds.includes(id)
      ? targetIds.filter((t) => t !== id)
      : [...targetIds, id];
    setTargetIds(next);
    void setMyOrgs(vc, affiliationId, next);
  }

  if (!loaded) {
    return <p className="text-sm text-guud-text-muted-2">불러오는 중…</p>;
  }

  return (
    <div className="space-y-4 border border-guud-hairline p-4">
      <div>
        <p className="text-xs font-semibold text-guud-text-muted-2">
          내 소속 단체
        </p>
        <Select
          value={affiliationId ?? undefined}
          onValueChange={updateAffiliation}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="소속 단체 선택" />
          </SelectTrigger>
          <SelectContent>
            {orgs.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name} ({org.region.sido} {org.region.sigungu})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="text-xs font-semibold text-guud-text-muted-2">
          내가 대상으로 하는 단체
        </p>
        <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto border border-guud-hairline p-2">
          {orgs
            .filter((o) => o.id !== affiliationId)
            .map((org) => (
              <li key={org.id} className="flex items-center gap-2">
                <Checkbox
                  id={`target-${org.id}`}
                  checked={targetIds.includes(org.id)}
                  onCheckedChange={() => toggleTarget(org.id)}
                />
                <Label
                  htmlFor={`target-${org.id}`}
                  className="text-xs font-normal"
                >
                  {org.name}
                </Label>
              </li>
            ))}
        </ul>
      </div>

      <div className="border-t border-guud-hairline pt-3">
        <p className="text-xs font-semibold text-guud-text-muted-2">종합 뷰</p>
        {!affiliationOrg ? (
          <p className="mt-1 text-sm text-guud-text-muted-2">
            소속 단체를 선택하면 대상 단체와의 관계를 비교해 보여줍니다.
          </p>
        ) : targetIds.length === 0 ? (
          <p className="mt-1 text-sm text-guud-text-muted-2">
            대상 단체를 1개 이상 선택하세요.
          </p>
        ) : (
          <ul className="mt-1 space-y-2">
            {targetIds.map((id) => {
              const target = orgById.get(id);
              if (!target) return null;
              const sharedFields = target.field_tags.filter((tag) =>
                affiliationOrg.field_tags.includes(tag),
              );
              const existingCase = collabCases.find(
                (c) =>
                  c.participant_org_ids.includes(affiliationOrg.id) &&
                  c.participant_org_ids.includes(target.id),
              );
              return (
                <li
                  key={id}
                  className="border border-guud-hairline p-2 text-sm"
                >
                  <p className="font-semibold text-foreground">{target.name}</p>
                  <p className="text-xs text-guud-text-muted-2">
                    공유 분야 {sharedFields.length}개 · buying_power{" "}
                    {target.buying_power} (우리 {affiliationOrg.buying_power})
                  </p>
                  {existingCase ? (
                    <p className="mt-1 text-xs text-foreground">
                      기존 협업 사례: {existingCase.title} (
                      {existingCase.status})
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-guud-text-muted-2">
                      아직 협업 사례 없음
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
