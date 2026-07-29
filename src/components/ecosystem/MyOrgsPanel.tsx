"use client";

// MyOrgsPanel — 소속 단체와 관심 단체를 설정하고 관계의 공통 기반을 비교한다.
// 설정은 로그인 사용자 상태로 서버에 저장된다.

import { Building2, Handshake, MapPin, Search, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { getCollabCases, getMyOrgs, setMyOrgs } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { useViewerContext } from "@/stores/viewer-context";
import type { CollabCase, Field, Organization } from "@/types";

export function MyOrgsPanel({
  orgs,
  fields,
}: {
  orgs: Organization[];
  fields: Field[];
}) {
  const vc = useViewerContext();
  const [affiliationId, setAffiliationId] = useState<string | null>(null);
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [collabCases, setCollabCases] = useState<CollabCase[]>([]);
  const [query, setQuery] = useState("");
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

  const orgById = useMemo(
    () => new Map(orgs.map((org) => [org.id, org])),
    [orgs],
  );
  const fieldById = useMemo(
    () => new Map(fields.map((field) => [field.id, field])),
    [fields],
  );
  const affiliationOrg = affiliationId ? orgById.get(affiliationId) : undefined;
  const filteredTargetOrgs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
    return orgs.filter((org) => {
      if (org.id === affiliationId) return false;
      if (!normalizedQuery) return true;
      return `${org.name} ${org.region.sido} ${org.region.sigungu} ${org.actor_type}`
        .toLocaleLowerCase("ko-KR")
        .includes(normalizedQuery);
    });
  }, [affiliationId, orgs, query]);

  function updateAffiliation(id: string) {
    setAffiliationId(id);
    const nextTargets = targetIds.filter((targetId) => targetId !== id);
    setTargetIds(nextTargets);
    void setMyOrgs(vc, id, nextTargets);
  }

  function toggleTarget(id: string) {
    const next = targetIds.includes(id)
      ? targetIds.filter((targetId) => targetId !== id)
      : [...targetIds, id];
    setTargetIds(next);
    void setMyOrgs(vc, affiliationId, next);
  }

  if (!loaded) {
    return (
      <aside className="space-y-3 rounded-[1.75rem] border border-guud-hairline bg-card p-5 xl:sticky xl:top-24">
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </aside>
    );
  }

  return (
    <aside className="overflow-hidden rounded-[1.75rem] border border-guud-hairline bg-card xl:sticky xl:top-24">
      <header className="bg-foreground p-5 text-background sm:p-6">
        <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
          <Target className="size-4" />
        </span>
        <p className="mt-5 font-mono text-[0.625rem] font-medium tracking-[0.14em] text-primary uppercase">
          MY RELATIONSHIP VIEW
        </p>
        <h3 className="mt-2 text-lg font-semibold">내 관계 중심으로 보기</h3>
        <p className="mt-2 text-xs leading-5 text-background/60">
          내 단체와 연결하고 싶은 단체를 고르면 공통 분야와 기존 협업을 한곳에서
          비교할 수 있어요.
        </p>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        <section>
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">
              내 소속 단체
            </p>
          </div>
          <Select
            value={affiliationId ?? undefined}
            onValueChange={updateAffiliation}
          >
            <SelectTrigger className="mt-3 w-full">
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
          {affiliationOrg && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-[0.625rem] text-guud-text-muted-2">
              <MapPin className="size-3 shrink-0 text-primary" />
              {affiliationOrg.region.sido} {affiliationOrg.region.sigungu} ·{" "}
              {affiliationOrg.actor_type}
            </div>
          )}
        </section>

        <section className="border-t border-guud-hairline pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="size-3.5 text-primary" />
              <p className="text-xs font-semibold text-foreground">관심 단체</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.625rem] font-semibold text-primary">
              {targetIds.length}곳 선택
            </span>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-guud-text-muted-2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="단체명·지역 검색"
              className="pl-9 text-xs"
            />
          </div>

          <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-xl border border-guud-hairline p-2">
            {filteredTargetOrgs.length === 0 ? (
              <li className="px-2 py-6 text-center text-xs text-guud-text-muted-2">
                검색 결과가 없습니다.
              </li>
            ) : (
              filteredTargetOrgs.map((org) => (
                <li key={org.id}>
                  <Label
                    htmlFor={`target-${org.id}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2.5 font-normal hover:bg-muted",
                      targetIds.includes(org.id) && "bg-muted",
                    )}
                  >
                    <Checkbox
                      id={`target-${org.id}`}
                      checked={targetIds.includes(org.id)}
                      onCheckedChange={() => toggleTarget(org.id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-foreground">
                        {org.name}
                      </span>
                      <span className="mt-0.5 block text-[0.625rem] text-guud-text-muted-2">
                        {org.region.sido} {org.region.sigungu} ·{" "}
                        {org.actor_type}
                      </span>
                    </span>
                  </Label>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="border-t border-guud-hairline pt-6">
          <div className="flex items-center gap-2">
            <Handshake className="size-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">관계 요약</p>
          </div>

          {!affiliationOrg ? (
            <p className="mt-3 rounded-xl bg-muted p-4 text-xs leading-5 text-guud-text-muted-2">
              소속 단체를 선택하면 관심 단체와의 연결 기반을 보여드려요.
            </p>
          ) : targetIds.length === 0 ? (
            <p className="mt-3 rounded-xl bg-muted p-4 text-xs leading-5 text-guud-text-muted-2">
              관심 단체를 1곳 이상 선택해 비교해 보세요.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {targetIds.map((id) => {
                const target = orgById.get(id);
                if (!target) return null;
                const sharedFields = target.field_tags.filter((tag) =>
                  affiliationOrg.field_tags.includes(tag),
                );
                const sharedFieldNames = sharedFields
                  .map((tag) => fieldById.get(tag)?.name)
                  .filter(Boolean);
                const existingCase = collabCases.find(
                  (collabCase) =>
                    collabCase.participant_org_ids.includes(
                      affiliationOrg.id,
                    ) && collabCase.participant_org_ids.includes(target.id),
                );
                return (
                  <li
                    key={id}
                    className="rounded-2xl border border-guud-hairline bg-background p-4"
                  >
                    <p className="text-xs font-semibold text-foreground">
                      {target.name}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sharedFieldNames.length > 0 ? (
                        sharedFieldNames.map((fieldName) => (
                          <span
                            key={fieldName}
                            className="rounded-full bg-primary/10 px-2 py-1 text-[0.625rem] font-semibold text-primary"
                          >
                            공통 · {fieldName}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-1 text-[0.625rem] text-guud-text-muted-2">
                          직접 겹치는 분야 없음
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-[0.625rem] text-guud-text-muted-2">
                        <span>조직 구매력 신호</span>
                        <span>{target.buying_power}/100</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${target.buying_power}%` }}
                        />
                      </div>
                    </div>

                    <p
                      className={cn(
                        "mt-4 rounded-xl px-3 py-2.5 text-[0.625rem] leading-4",
                        existingCase
                          ? "bg-emerald-50 text-emerald-900"
                          : "bg-muted text-guud-text-muted-2",
                      )}
                    >
                      {existingCase
                        ? `기존 협업 · ${existingCase.title} (${existingCase.status})`
                        : "등록된 협업 사례는 아직 없습니다."}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="border-t border-guud-hairline pt-4 text-[0.625rem] leading-4 text-guud-text-muted-2">
          이 설정은 현재 세션에서만 유지되며 새로고침하면 기본값으로 돌아갑니다.
        </p>
      </div>
    </aside>
  );
}
