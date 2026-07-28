"use client";

// EcosystemMapV2 — 생태계맵 v2: 분야→밸류체인→단계간 자원 흐름→5-force→실제 단체.
// 근거: ARCHITECTURE.md §3·§5.2, PRD §8.15, FR-EM2-01~04, TASKS #28

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDot,
  Coins,
  Database,
  MapPin,
  Network,
  Route,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import fieldsSeed from "@/data/fields.json";
import { cn } from "@/lib/utils";
import type {
  Field,
  FiveForce,
  Organization,
  StageLink,
  VCStage,
} from "@/types";
import { MyOrgsPanel } from "./MyOrgsPanel";

const fields = (fieldsSeed as Field[]).filter((field) => !field.is_extension);
const forceRoles: FiveForce["role"][] = [
  "신규진입자",
  "공급자",
  "기존경쟁자",
  "구매자",
  "대체재",
];

const forceDescriptions: Record<FiveForce["role"], string> = {
  신규진입자: "새롭게 들어오는 주체",
  공급자: "자원과 제도를 공급",
  기존경쟁자: "현재 활동하는 주체",
  구매자: "수요를 만들고 발주",
  대체재: "대안이 되는 경로",
};

const actorTypeStyles: Record<Organization["actor_type"], string> = {
  공공: "bg-sky-50 text-sky-800",
  중간지원: "bg-violet-50 text-violet-800",
  사회적경제: "bg-emerald-50 text-emerald-800",
  영리플랫폼: "bg-amber-50 text-amber-800",
};

function getDefaultStageId(
  fieldId: number | null,
  stages: VCStage[],
  forces: FiveForce[],
) {
  if (fieldId === null) return null;
  return (
    stages.find(
      (stage) =>
        stage.field_id === fieldId &&
        forces.some((force) => force.vc_stage_id === stage.id),
    )?.id ??
    stages.find((stage) => stage.field_id === fieldId)?.id ??
    null
  );
}

function getDefaultForceRole(stageId: number | null, forces: FiveForce[]) {
  if (stageId === null) return null;
  return (
    forces.find(
      (force) => force.vc_stage_id === stageId && force.org_ids.length > 0,
    )?.role ?? null
  );
}

function ForceCard({
  role,
  force,
  isSelected,
  isCenter,
  onSelect,
}: {
  role: FiveForce["role"];
  force: FiveForce | undefined;
  isSelected: boolean;
  isCenter?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!force}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        "group h-full min-h-28 w-full rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40",
        isCenter && "sm:min-h-36",
        isSelected
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-guud-hairline bg-background hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-8 place-items-center rounded-full",
            isSelected ? "bg-white/15" : "bg-muted text-primary",
          )}
        >
          <CircleDot className="size-4" />
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-1 text-[0.625rem] font-semibold",
            isSelected ? "bg-white/15" : "bg-muted text-guud-text-muted-2",
          )}
        >
          {force ? `${force.org_ids.length}곳` : "미설정"}
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold">{role}</p>
      <p
        className={cn(
          "mt-1 text-xs leading-5",
          isSelected ? "text-primary-foreground/75" : "text-guud-text-muted-2",
        )}
      >
        {forceDescriptions[role]}
      </p>
    </button>
  );
}

export function EcosystemMapV2({
  stages,
  forces,
  orgs,
  stageLinks,
}: {
  stages: VCStage[];
  forces: FiveForce[];
  orgs: Organization[];
  stageLinks: StageLink[];
}) {
  const defaultFieldId =
    fields.find((field) => field.name === "돌봄")?.id ??
    stages[0]?.field_id ??
    null;
  const defaultStageId = getDefaultStageId(defaultFieldId, stages, forces);
  const [fieldId, setFieldId] = useState<number | null>(defaultFieldId);
  const [stageId, setStageId] = useState<number | null>(defaultStageId);
  const [forceRole, setForceRole] = useState<FiveForce["role"] | null>(() =>
    getDefaultForceRole(defaultStageId, forces),
  );

  const fieldById = useMemo(
    () => new Map(fields.map((field) => [field.id, field])),
    [],
  );
  const stageById = useMemo(
    () => new Map(stages.map((stage) => [stage.id, stage])),
    [stages],
  );
  const orgById = useMemo(
    () => new Map(orgs.map((org) => [org.id, org])),
    [orgs],
  );

  const selectedField = fieldId === null ? undefined : fieldById.get(fieldId);
  const selectedStage = stageId === null ? undefined : stageById.get(stageId);
  const stagesForField = useMemo(
    () => stages.filter((stage) => stage.field_id === fieldId),
    [stages, fieldId],
  );
  const forcesForStage = useMemo(
    () => forces.filter((force) => force.vc_stage_id === stageId),
    [forces, stageId],
  );
  const selectedForce = forcesForStage.find(
    (force) => force.role === forceRole,
  );
  const connectedLinks = useMemo(
    () =>
      stageId === null
        ? []
        : stageLinks.filter(
            (link) => link.from_stage === stageId || link.to_stage === stageId,
          ),
    [stageId, stageLinks],
  );
  const orgsForForce = useMemo(() => {
    if (!selectedForce) return [];
    return selectedForce.org_ids
      .map((id) => orgById.get(id))
      .filter((org): org is Organization => Boolean(org));
  }, [selectedForce, orgById]);
  const orgsByRegion = useMemo(() => {
    const groups = new Map<string, Organization[]>();
    for (const org of orgsForForce) {
      const list = groups.get(org.region.sido) ?? [];
      list.push(org);
      groups.set(org.region.sido, list);
    }
    return groups;
  }, [orgsForForce]);

  function selectField(nextFieldId: number) {
    const nextStageId = getDefaultStageId(nextFieldId, stages, forces);
    setFieldId(nextFieldId);
    setStageId(nextStageId);
    setForceRole(getDefaultForceRole(nextStageId, forces));
  }

  function selectStage(nextStageId: number) {
    setStageId(nextStageId);
    setForceRole(getDefaultForceRole(nextStageId, forces));
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <nav
          aria-label="생태계맵 탐색 단계"
          className="overflow-hidden rounded-2xl border border-guud-hairline bg-card"
        >
          <ol className="grid divide-y divide-guud-hairline sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              ["01 분야", selectedField?.name ?? "선택"],
              ["02 단계", selectedStage?.name ?? "선택"],
              ["03 이해관계자", forceRole ?? "선택"],
              [
                "04 지역 단체",
                selectedForce ? `${orgsForForce.length}곳` : "선택",
              ],
            ].map(([label, value], index) => (
              <li key={label} className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[0.625rem] text-guud-text-muted-2">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.625rem] text-guud-text-muted-2">
                    {label}
                  </span>
                  <span className="block truncate text-xs font-semibold text-foreground">
                    {value}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </nav>

        <section className="overflow-hidden rounded-[1.75rem] border border-guud-hairline bg-card">
          <div className="border-b border-guud-hairline p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                <Network className="size-4" />
              </span>
              <div>
                <p className="font-mono text-[0.625rem] font-medium tracking-[0.14em] text-guud-text-muted-2 uppercase">
                  01 · FIELD
                </p>
                <h3 className="text-base font-semibold text-foreground">
                  어떤 생태계를 살펴볼까요?
                </h3>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {fields.map((field) => {
                const fieldStageCount = stages.filter(
                  (stage) => stage.field_id === field.id,
                ).length;
                return (
                  <button
                    key={field.id}
                    type="button"
                    aria-pressed={fieldId === field.id}
                    onClick={() => selectField(field.id)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition-colors",
                      fieldId === field.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-guud-hairline bg-background hover:border-foreground/20",
                    )}
                  >
                    <span className="block text-sm font-semibold">
                      {field.name}
                    </span>
                    <span
                      className={cn(
                        "mt-1 block text-[0.625rem]",
                        fieldId === field.id
                          ? "text-primary-foreground/70"
                          : "text-guud-text-muted-2",
                      )}
                    >
                      밸류체인 {fieldStageCount}단계
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedField && (
              <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-xs leading-5 text-guud-text-muted-2">
                <strong className="mr-1 text-foreground">
                  {selectedField.name}
                </strong>
                {selectedField.definition}
              </p>
            )}
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[0.625rem] font-medium tracking-[0.14em] text-guud-text-muted-2 uppercase">
                  02 · VALUE CHAIN
                </p>
                <h3 className="mt-1 text-base font-semibold text-foreground">
                  밸류체인의 한 단계를 선택하세요
                </h3>
              </div>
              <span className="shrink-0 text-xs text-guud-text-muted-2">
                {stagesForField.length}개 단계
              </span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {stagesForField.map((stage, index) => (
                <button
                  key={stage.id}
                  type="button"
                  aria-pressed={stageId === stage.id}
                  onClick={() => selectStage(stage.id)}
                  className={cn(
                    "relative rounded-2xl border p-4 text-left transition-all",
                    stageId === stage.id
                      ? "border-foreground bg-foreground text-background shadow-sm"
                      : "border-guud-hairline bg-background hover:-translate-y-0.5 hover:border-foreground/20",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "font-mono text-[0.625rem]",
                        stageId === stage.id
                          ? "text-primary"
                          : "text-guud-text-muted-2",
                      )}
                    >
                      STEP {String(index + 1).padStart(2, "0")}
                    </span>
                    {index < stagesForField.length - 1 && (
                      <ArrowRight
                        aria-hidden="true"
                        className={cn(
                          "size-3.5",
                          stageId === stage.id
                            ? "text-background/50"
                            : "text-guud-text-muted-2",
                        )}
                      />
                    )}
                  </div>
                  <span className="mt-5 block text-sm font-semibold">
                    {stage.name}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-[0.625rem]",
                      stageId === stage.id
                        ? "text-background/60"
                        : "text-guud-text-muted-2",
                    )}
                  >
                    {stage.meta_stage}
                  </span>
                </button>
              ))}
            </div>

            {selectedStage && (
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {[
                  {
                    icon: Activity,
                    label: "주요 활동",
                    value: selectedStage.key_activity,
                  },
                  {
                    icon: Coins,
                    label: "수익 기반",
                    value: selectedStage.revenue_source,
                  },
                  {
                    icon: BadgeCheck,
                    label: "성공 조건",
                    value: selectedStage.success_factor,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.label}
                      className="rounded-xl bg-muted p-4"
                    >
                      <Icon className="size-4 text-primary" />
                      <p className="mt-3 text-[0.625rem] font-semibold text-guud-text-muted-2">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-foreground">
                        {item.value}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}

            {selectedStage?.unit_economics && (
              <details className="mt-3 rounded-xl border border-guud-hairline bg-background px-4 py-3">
                <summary className="cursor-pointer text-xs font-semibold text-foreground">
                  이 단계의 단위경제 참고
                </summary>
                <p className="mt-3 text-xs leading-5 text-guud-text-muted-2">
                  {selectedStage.unit_economics}
                </p>
              </details>
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-guud-hairline bg-[#f5efe5] p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Route className="size-4" />
              </span>
              <div>
                <p className="font-mono text-[0.625rem] font-medium tracking-[0.14em] text-guud-text-muted-2 uppercase">
                  RESOURCE FLOW
                </p>
                <h3 className="mt-1 text-base font-semibold text-foreground">
                  이 단계에서 오가는 자원
                </h3>
                <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
                  실제 연결은 확인된 관계, 잠재 연결은 협업 기회 후보입니다.
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-foreground">
              연결 {connectedLinks.length}개
            </span>
          </div>

          {connectedLinks.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-foreground/15 bg-background/60 p-5 text-sm text-guud-text-muted-2">
              아직 사전에 등록된 단계 연결이 없습니다. 연결이 비어 있는 지점은
              새로운 협업을 검토할 후보가 될 수 있어요.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {connectedLinks.map((link) => {
                const isOutgoing = link.from_stage === stageId;
                const fromStage = stageById.get(link.from_stage);
                const toStage = stageById.get(link.to_stage);
                const peerStage = isOutgoing ? toStage : fromStage;
                const peerField = peerStage
                  ? fieldById.get(peerStage.field_id)
                  : undefined;
                return (
                  <article
                    key={link.id}
                    className="rounded-2xl border border-foreground/10 bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.625rem] font-semibold text-primary">
                        {link.resource_flow}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[0.625rem] font-semibold",
                          link.status === "실제"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-800",
                        )}
                      >
                        {link.status === "실제"
                          ? "확인된 연결"
                          : "협업 기회 후보"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-foreground">
                      <span>{selectedStage?.name}</span>
                      <ArrowRight
                        className={cn(
                          "size-3.5 shrink-0",
                          !isOutgoing && "rotate-180",
                        )}
                      />
                      <span>
                        {peerField?.name} · {peerStage?.name}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-guud-text-muted-2">
                      {link.rationale}
                    </p>
                    <p className="mt-3 border-t border-guud-hairline pt-3 text-[0.625rem] leading-4 text-guud-text-muted-2">
                      근거 · {link.evidence_source}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-guud-hairline bg-card p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <CircleDot className="size-4" />
            </span>
            <div>
              <p className="font-mono text-[0.625rem] font-medium tracking-[0.14em] text-guud-text-muted-2 uppercase">
                03 · STAKEHOLDERS
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                어떤 힘이 이 단계를 움직일까요?
              </h3>
              <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
                역할을 선택하면 해당하는 실제 단체를 지역별로 확인할 수 있어요.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:grid-rows-3">
            {forceRoles.map((role) => {
              const position = {
                신규진입자: "sm:col-start-2 sm:row-start-1",
                공급자: "sm:col-start-1 sm:row-start-2",
                기존경쟁자: "sm:col-start-2 sm:row-start-2",
                구매자: "sm:col-start-3 sm:row-start-2",
                대체재: "sm:col-start-2 sm:row-start-3",
              }[role];
              return (
                <div key={role} className={position}>
                  <ForceCard
                    role={role}
                    force={forcesForStage.find((force) => force.role === role)}
                    isSelected={forceRole === role}
                    isCenter={role === "기존경쟁자"}
                    onSelect={() => setForceRole(role)}
                  />
                </div>
              );
            })}
          </div>

          {selectedForce && (
            <div className="mt-6 rounded-2xl bg-muted p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedForce.role}의 역할
                  </p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-guud-text-muted-2">
                    {selectedForce.actor_type_hint}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-foreground">
                  {orgsForForce.length}곳 연결
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-guud-hairline bg-card p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[0.625rem] font-medium tracking-[0.14em] text-guud-text-muted-2 uppercase">
                04 · ORGANIZATIONS
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                지역에서 실제로 활동하는 단체
              </h3>
            </div>
            <ul
              className="flex flex-wrap gap-1.5"
              aria-label="단체 주체 유형 범례"
            >
              {Object.entries(actorTypeStyles).map(([actorType, style]) => (
                <li
                  key={actorType}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[0.625rem] font-semibold",
                    style,
                  )}
                >
                  {actorType}
                </li>
              ))}
            </ul>
          </div>

          {!selectedForce ? (
            <div className="mt-5 rounded-2xl border border-dashed border-guud-hairline p-8 text-center">
              <Building2 className="mx-auto size-5 text-guud-text-muted-2" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                이해관계자 역할을 선택해 주세요
              </p>
              <p className="mt-1 text-xs text-guud-text-muted-2">
                선택한 역할과 연결된 단체가 여기에 표시됩니다.
              </p>
            </div>
          ) : orgsForForce.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-guud-hairline p-8 text-center">
              <Database className="mx-auto size-5 text-guud-text-muted-2" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                아직 확인된 단체가 없습니다
              </p>
              <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
                데이터가 비어 있는 영역도 생태계의 공백을 보여주는 중요한
                신호예요.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {Array.from(orgsByRegion.entries()).map(([sido, list]) => (
                <div key={sido}>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-primary" />
                    <p className="text-xs font-semibold text-foreground">
                      {sido}
                    </p>
                    <span className="text-[0.625rem] text-guud-text-muted-2">
                      {list.length}곳
                    </span>
                  </div>
                  <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                    {list.map((org) => (
                      <li
                        key={org.id}
                        className="rounded-2xl border border-guud-hairline bg-background p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {org.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[0.625rem] text-guud-text-muted-2">
                              <MapPin className="size-3" /> {org.region.sido}{" "}
                              {org.region.sigungu}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-1 text-[0.625rem] font-semibold",
                              actorTypeStyles[org.actor_type],
                            )}
                          >
                            {org.actor_type}
                          </span>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-3 text-[0.625rem]">
                          <div>
                            <dt className="text-guud-text-muted-2">
                              분류 신뢰도
                            </dt>
                            <dd className="mt-0.5 font-semibold text-foreground">
                              {Math.round(org.ai_confidence * 100)}%
                            </dd>
                          </div>
                          <div>
                            <dt className="text-guud-text-muted-2">
                              최근 확인
                            </dt>
                            <dd className="mt-0.5 font-semibold text-foreground">
                              {org.last_checked_at.replaceAll("-", ".")}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-3 flex items-start gap-2 text-[0.625rem] leading-4 text-guud-text-muted-2">
                          {org.verified_by.length > 0 ? (
                            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
                          ) : (
                            <Database className="mt-0.5 size-3.5 shrink-0" />
                          )}
                          <span>
                            {org.verified_by.length > 0
                              ? "회원 확인 완료"
                              : "공개 데이터 기반"}
                            {" · "}
                            {org.source}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-guud-hairline bg-muted px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-xs leading-5 text-guud-text-muted-2">
              공개 데이터의 분류 결과에 회원 확인을 더해 정확도를 높입니다.
              신뢰도와 최근 확인일을 함께 보고 연결을 판단해 주세요.
            </p>
          </div>
        </section>
      </div>

      <MyOrgsPanel orgs={orgs} />
    </div>
  );
}
