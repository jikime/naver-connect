"use client";

// RoleSwitcher — 역할 3종 + 페르소나 8인 즉시 전환(로그인 없음, FR-GL-01).
// 근거: ARCHITECTURE.md §3(L3)·§7 ADR-01, TASKS.md T-007
// 전 화면 가시성의 단일 입력인 ViewerContext 스토어를 직접 갱신한다. 페르소나 목록은
// Server Component(layout.tsx)가 DAL(getMembers)로 읽어 공개 필드만 props로 내려준다
// (민감 시드를 Client Component가 직접 import하지 않는다, ADR-03/04).

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  OPERATOR_PERSONA_ID,
  useViewerContextStore,
} from "@/stores/viewer-context";
import type { MemberType, ViewerContext } from "@/types";

export interface PersonaRosterEntry {
  id: string;
  name: string;
  member_type: MemberType;
}

const ROLES: ViewerContext["role"][] = ["기업가", "전문가", "운영자"];

function roleForMemberType(memberType: MemberType): ViewerContext["role"] {
  return memberType;
}

export function RoleSwitcher({
  personas,
  className,
  roleFieldsetClassName,
}: {
  personas: PersonaRosterEntry[];
  /** Task #31: 모바일 Sheet 상단(mp-persona 패턴)에서 좁은 폭에 맞춰 줄바꿈시킬 때 사용 */
  className?: string;
  /** Task #32(3차): GNB 한 행 통합 시 md~lg 구간 폭 부족 대응 — 역할 버튼 3개를 좁은 폭에서
   * 숨기고 페르소나 셀렉트만 남기는 용도(예: "hidden lg:flex"). 모바일 Sheet 호출부는 항상
   * 전체 노출이 필요하므로 이 prop을 넘기지 않는다(기본값 미지정 시 항상 flex). */
  roleFieldsetClassName?: string;
}) {
  const role = useViewerContextStore((state) => state.role);
  const personaId = useViewerContextStore((state) => state.personaId);
  const setViewer = useViewerContextStore((state) => state.setViewer);

  const personasForRole = personas.filter(
    (p) => roleForMemberType(p.member_type) === role,
  );

  function handleRoleChange(nextRole: ViewerContext["role"]) {
    if (nextRole === "운영자") {
      setViewer({ role: nextRole, personaId: OPERATOR_PERSONA_ID });
      return;
    }
    const matching = personas.filter(
      (p) => roleForMemberType(p.member_type) === nextRole,
    );
    const nextPersonaId = matching.some((p) => p.id === personaId)
      ? personaId
      : (matching[0]?.id ?? personaId);
    setViewer({ role: nextRole, personaId: nextPersonaId });
  }

  function handlePersonaChange(nextPersonaId: string) {
    setViewer({ role, personaId: nextPersonaId });
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <fieldset
        aria-label="역할 전환(데모 스위처)"
        className={cn(
          "m-0 flex gap-1 border border-border bg-background p-0",
          roleFieldsetClassName,
        )}
      >
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={role === r}
            onClick={() => handleRoleChange(r)}
            className={
              role === r
                ? "px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground"
                : "px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            }
          >
            {r}
          </button>
        ))}
      </fieldset>

      {role !== "운영자" && (
        <Select value={personaId} onValueChange={handlePersonaChange}>
          <SelectTrigger
            size="sm"
            aria-label="페르소나 선택"
            className="w-auto text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {personasForRole.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
