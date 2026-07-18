// GateStatusBadge — G1~G4 게이트 통과 여부. 텍스트 라벨 병기(색만 의존 금지, NFR-05/§18).
// 근거: ARCHITECTURE.md §3(L3), TASKS.md T-008, FR-DR-01·FR-OP-03 계열

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GateState } from "@/types";

export function GateStatusBadge({
  gate,
  state,
}: {
  gate: "G1" | "G2" | "G3" | "G4";
  state: GateState;
}) {
  return (
    <Badge
      title={state.date ? `${gate} 처리일: ${state.date}` : undefined}
      className={cn(
        "rounded-full px-2.5 py-0.5 font-semibold tracking-normal normal-case",
        state.passed
          ? "bg-primary text-primary-foreground"
          : "border border-guud-text-faint text-guud-text-muted-2 bg-background",
      )}
    >
      {gate} {state.passed ? "통과" : "미통과"}
    </Badge>
  );
}
