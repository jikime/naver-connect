"use client";

// EcosystemMapV2 — 생태계맵 v2: 밸류체인→5-force→실제 단체→지역 세분화 드릴다운.
// 근거: ARCHITECTURE.md §3·§5.2, PRD §8.15, FR-EM2-01~04, TASKS #28
// 구 FR-EM-01~03(이웃회원·주변조직 카드 리스트)을 대체한다(PRD §8.11 "폐기" 명시).
// 5-force·지역 세분화 데이터는 운영자 사전 세팅(five_forces.json)을 읽기 전용으로 노출한다(FR-EM2-04).

import { useMemo, useState } from "react";
import fieldsSeed from "@/data/fields.json";
import { cn } from "@/lib/utils";
import type { Field, FiveForce, Organization, VCStage } from "@/types";
import { MyOrgsPanel } from "./MyOrgsPanel";

const fields = (fieldsSeed as Field[]).filter((f) => !f.is_extension);

/** 5-force 카드 하나. isCenter는 포터 모델의 "기존경쟁자"(중앙) 강조용. */
function ForceCard({
  roleLabel,
  force,
  isSelected,
  isCenter,
  onSelect,
}: {
  roleLabel: FiveForce["role"];
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
        "h-full w-full border p-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40",
        isCenter && "border-2",
        isSelected
          ? "border-foreground bg-muted"
          : "border-guud-hairline hover:text-foreground",
      )}
    >
      <p className="font-semibold text-foreground">{roleLabel}</p>
      {force ? (
        <>
          <p className="mt-0.5 text-xs text-guud-text-muted-2">
            {force.actor_type_hint}
          </p>
          <p className="mt-0.5 text-xs text-guud-text-muted-2">
            단체 {force.org_ids.length}곳
          </p>
        </>
      ) : (
        <p className="mt-0.5 text-xs text-guud-text-muted-2">
          세팅된 단체 없음
        </p>
      )}
    </button>
  );
}

export function EcosystemMapV2({
  stages,
  forces,
  orgs,
}: {
  stages: VCStage[];
  forces: FiveForce[];
  orgs: Organization[];
}) {
  const [fieldId, setFieldId] = useState<number | null>(null);
  const [stageId, setStageId] = useState<number | null>(null);
  const [forceRole, setForceRole] = useState<FiveForce["role"] | null>(null);

  const orgById = useMemo(() => new Map(orgs.map((o) => [o.id, o])), [orgs]);

  const stagesForField = useMemo(
    () => stages.filter((s) => s.field_id === fieldId),
    [stages, fieldId],
  );
  const forcesForStage = useMemo(
    () => forces.filter((f) => f.vc_stage_id === stageId),
    [forces, stageId],
  );
  const selectedForce = forcesForStage.find((f) => f.role === forceRole);
  const orgsForForce = useMemo(() => {
    if (!selectedForce) return [];
    return selectedForce.org_ids
      .map((id) => orgById.get(id))
      .filter((o): o is Organization => Boolean(o));
  }, [selectedForce, orgById]);

  const orgsByRegion = useMemo(() => {
    const groups = new Map<string, Organization[]>();
    for (const org of orgsForForce) {
      const key = org.region.sido;
      const list = groups.get(key) ?? [];
      list.push(org);
      groups.set(key, list);
    }
    return groups;
  }, [orgsForForce]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-xs font-semibold text-guud-text-muted-2">
            1. 분야 선택
          </h2>
          <div className="flex flex-wrap gap-2">
            {fields.map((field) => (
              <button
                key={field.id}
                type="button"
                aria-pressed={fieldId === field.id}
                onClick={() => {
                  setFieldId(field.id);
                  setStageId(null);
                  setForceRole(null);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium",
                  fieldId === field.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-guud-text-muted-2 hover:text-foreground",
                )}
              >
                {field.name}
              </button>
            ))}
          </div>
        </section>

        {fieldId !== null && (
          <section>
            <h2 className="mb-2 text-xs font-semibold text-guud-text-muted-2">
              2. 밸류체인 단계
            </h2>
            <div className="flex flex-wrap gap-2">
              {stagesForField.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  aria-pressed={stageId === stage.id}
                  onClick={() => {
                    setStageId(stage.id);
                    setForceRole(null);
                  }}
                  className={cn(
                    "border px-3 py-2 text-left text-sm",
                    stageId === stage.id
                      ? "border-foreground bg-muted font-semibold text-foreground"
                      : "border-guud-hairline text-guud-text-muted-2 hover:text-foreground",
                  )}
                >
                  {stage.name}
                  <span className="ml-1 text-[10px] text-guud-text-muted-2">
                    #{stage.id}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {stageId !== null && (
          <section>
            <h2 className="mb-2 text-xs font-semibold text-guud-text-muted-2">
              3. 5-force 이해관계자
            </h2>
            {/* 포터(Porter) 5-force 모델 관례 배치 — 기존경쟁자를 중앙에 두고
                신규진입자(위)·공급자(좌)·구매자(우)·대체재(아래) 4방향으로 감싼다.
                좁은 화면에서는 같은 순서로 세로 스택(모바일 축소 대응). */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:grid-rows-3">
              <div className="sm:col-start-2 sm:row-start-1">
                <ForceCard
                  roleLabel="신규진입자"
                  force={forcesForStage.find((f) => f.role === "신규진입자")}
                  isSelected={forceRole === "신규진입자"}
                  onSelect={() => setForceRole("신규진입자")}
                />
              </div>
              <div className="sm:col-start-1 sm:row-start-2">
                <ForceCard
                  roleLabel="공급자"
                  force={forcesForStage.find((f) => f.role === "공급자")}
                  isSelected={forceRole === "공급자"}
                  onSelect={() => setForceRole("공급자")}
                />
              </div>
              <div className="sm:col-start-2 sm:row-start-2">
                <ForceCard
                  roleLabel="기존경쟁자"
                  force={forcesForStage.find((f) => f.role === "기존경쟁자")}
                  isSelected={forceRole === "기존경쟁자"}
                  onSelect={() => setForceRole("기존경쟁자")}
                  isCenter
                />
              </div>
              <div className="sm:col-start-3 sm:row-start-2">
                <ForceCard
                  roleLabel="구매자"
                  force={forcesForStage.find((f) => f.role === "구매자")}
                  isSelected={forceRole === "구매자"}
                  onSelect={() => setForceRole("구매자")}
                />
              </div>
              <div className="sm:col-start-2 sm:row-start-3">
                <ForceCard
                  roleLabel="대체재"
                  force={forcesForStage.find((f) => f.role === "대체재")}
                  isSelected={forceRole === "대체재"}
                  onSelect={() => setForceRole("대체재")}
                />
              </div>
            </div>
          </section>
        )}

        {selectedForce && (
          <section>
            <h2 className="mb-2 text-xs font-semibold text-guud-text-muted-2">
              4. 실제 단체 — 지역별 세분화 ({orgsForForce.length}곳)
            </h2>
            <div className="space-y-3">
              {Array.from(orgsByRegion.entries()).map(([sido, list]) => (
                <div key={sido}>
                  <p className="text-xs font-semibold text-foreground">
                    {sido} ({list.length})
                  </p>
                  <ul className="mt-1 grid gap-2 sm:grid-cols-2">
                    {list.map((org) => (
                      <li
                        key={org.id}
                        className="border border-guud-hairline p-2 text-sm"
                      >
                        <p className="font-medium text-foreground">
                          {org.name}
                        </p>
                        <p className="text-xs text-guud-text-muted-2">
                          {org.region.sido} {org.region.sigungu} ·{" "}
                          {org.actor_type} · buying_power {org.buying_power}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <MyOrgsPanel orgs={orgs} />
    </div>
  );
}
