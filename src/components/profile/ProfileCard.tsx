"use client";

// ProfileCard — 공개/비공개층을 시각적으로 구분해 보여주는 프로필 카드(FR-ON-08, FR-GL-02/03).
// 근거: ARCHITECTURE.md §3(L2 ProfileCard), TASKS.md T-010
// 뷰어(ViewerContext)와 별개로 "보고 있는 프로필"을 고를 수 있게 해 접근제어를 시연한다 —
// getMember(vc, targetId)는 vc가 targetId 본인/운영자가 아니면 visibility.private를 null로
// 마스킹해서 반환한다(ADR-03). 이 컴포넌트는 이미 마스킹된 DTO만 받으므로 비공개 필드가
// 타인 뷰어의 DOM에 실리지 않는다(2차 방어는 VisibilityGate).

import { useEffect, useId, useState } from "react";
import { VisibilityGate } from "@/components/shared/VisibilityGate";
import fieldsSeed from "@/data/fields.json";
import { getMember, getMembers } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { Field, MaskedMember } from "@/types";

const fields = fieldsSeed as Field[];

interface RosterEntry {
  id: string;
  name: string;
}

function fieldNames(ids: number[]): string {
  return ids
    .map((id) => fields.find((f) => f.id === id)?.name ?? `#${id}`)
    .join(", ");
}

export function ProfileCard() {
  const vc = useViewerContext();
  const selectId = useId();

  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [selectedId, setSelectedId] = useState(vc.personaId);
  const [member, setMember] = useState<MaskedMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 뷰어 페르소나가 바뀌면 기본 선택도 "내 프로필"로 따라간다(운영자는 예외 — 선택 유지).
  // biome-ignore lint/correctness/useExhaustiveDependencies: vc.role 조건은 매 렌더 새 vc 참조와 무관해 deps에서 뺀다
  useEffect(() => {
    if (vc.role !== "운영자") {
      setSelectedId(vc.personaId);
    }
  }, [vc.personaId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: vc 객체는 selector가 매 렌더 새로 만들어 원시값(vc.role)만 추적한다
  useEffect(() => {
    let cancelled = false;
    getMembers(vc).then((members) => {
      if (cancelled) return;
      setRoster(members.map((m) => ({ id: m.id, name: m.name })));
    });
    return () => {
      cancelled = true;
    };
  }, [vc.role]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: vc 객체는 selector가 매 렌더 새로 만들어 원시값(personaId/role)만 추적한다
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMember(vc, selectedId)
      .then((m) => {
        if (!cancelled) setMember(m);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "프로필을 찾을 수 없어요.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vc.personaId, vc.role, selectedId]);

  const isSelf = selectedId === vc.personaId;
  const isPrivileged = member ? member.visibility.private !== null : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-foreground"
        >
          보고 있는 프로필
        </label>
        <select
          id={selectId}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-9 border border-input bg-background px-2 text-sm text-foreground"
        >
          {roster.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.id === vc.personaId ? " (나)" : ""}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-guud-text-muted-2">
        현재 뷰어:{" "}
        <span className="font-semibold text-foreground">{vc.role}</span> ·
        비공개층은{" "}
        <span className="font-semibold text-foreground">
          {isPrivileged ? "표시 중" : "숨김"}
        </span>
        {isSelf
          ? "(본인 프로필)"
          : isPrivileged
            ? "(운영자 권한)"
            : "(타인 프로필)"}
      </p>

      {loading && (
        <p className="text-sm text-guud-text-muted-2">불러오는 중…</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {member && !loading && (
        <div className="space-y-4 border border-guud-hairline">
          <div className="space-y-2 border-b border-guud-hairline p-4">
            <h2 className="font-heading text-xl font-bold text-foreground">
              {member.name}
            </h2>
            <p className="text-sm text-guud-text-muted-2">
              {member.org.name} · {member.org.type} · {member.org.role}
            </p>
            <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-sm">
              <dt className="text-guud-text-muted-2">지역</dt>
              <dd className="text-foreground">
                {member.region.sido} {member.region.sigungu}
              </dd>
              <dt className="text-guud-text-muted-2">분야</dt>
              <dd className="text-foreground">
                {fieldNames(member.field_tags)}
              </dd>
              <dt className="text-guud-text-muted-2">밸류체인</dt>
              <dd className="text-foreground">{member.value_chain_stage}</dd>
              <dt className="text-guud-text-muted-2">미션</dt>
              <dd className="text-foreground">{member.mission_statement}</dd>
              <dt className="text-guud-text-muted-2">신뢰 연결점</dt>
              <dd className="text-foreground">
                {member.trust_connections
                  .map((tc) => `${tc.type}: ${tc.ref}`)
                  .join(" / ") || "없음"}
              </dd>
            </dl>
          </div>

          <div className="grid gap-0 p-4 pt-0 sm:grid-cols-2 sm:gap-4">
            <section
              aria-labelledby={`${selectId}-public`}
              className="space-y-2 py-2"
            >
              <h3
                id={`${selectId}-public`}
                className="text-xs font-semibold tracking-wide text-guud-text-muted-2 uppercase"
              >
                공개 프로필 (전체 회원 열람 가능)
              </h3>
              <ul className="space-y-1 text-sm text-foreground">
                {member.visibility.public.supply_tags.map((s) => (
                  <li key={s.tagId}>공급: {s.detail}</li>
                ))}
                <li>활동: {member.visibility.public.activities.join(", ")}</li>
                <li>선호 방식: {member.visibility.public.preferred_mode}</li>
              </ul>
            </section>

            <section
              aria-labelledby={`${selectId}-private`}
              className="space-y-2 border-t border-dashed border-guud-text-faint py-2 sm:border-t-0 sm:border-l sm:pl-4"
            >
              <h3
                id={`${selectId}-private`}
                className="text-xs font-semibold tracking-wide text-guud-text-muted-2 uppercase"
              >
                비공개 (본인·운영자만)
              </h3>
              <VisibilityGate
                value={member.visibility.private}
                fallbackLabel="비공개 — 본인 또는 운영자만 볼 수 있어요"
              >
                {(priv) => (
                  <ul className="space-y-2 text-sm text-foreground">
                    {priv.demand_tags.map((d) => (
                      <li key={d.tagId}>
                        {d.priority && (
                          <span className="text-destructive">★ </span>
                        )}
                        <blockquote className="border-l-2 border-guud-text-faint pl-2 italic">
                          “{d.detail_quote}”
                        </blockquote>
                      </li>
                    ))}
                    <li>가용시간: {priv.availability}</li>
                    {priv.hot_lead?.flag && (
                      <li className="text-destructive">
                        핫리드 · {priv.hot_lead.project_summary}
                      </li>
                    )}
                  </ul>
                )}
              </VisibilityGate>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
