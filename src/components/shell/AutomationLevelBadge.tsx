// AutomationLevelBadge — FR별 [자동]/[보조]/[수동] 뱃지. automationRegistry(T-001)를 소스로 렌더한다.
// 근거: ARCHITECTURE.md §6 NFR-08, TASKS.md T-007/T-008
// 인터랙션 없음 — Server/Client 어디서나 그대로 쓸 수 있게 'use client' 없이 둔다.

import { Badge } from "@/components/ui/badge";
import { getAutomationMeta } from "@/lib/access/automation-registry";
import { cn } from "@/lib/utils";
import type { AutomationLevel } from "@/types";

const LEVEL_STYLE: Record<AutomationLevel, string> = {
  자동: "bg-primary text-primary-foreground",
  보조: "border border-foreground text-foreground bg-background",
  수동: "border border-guud-text-faint text-guud-text-muted-2 bg-background",
};

export function AutomationLevelBadge({ frId }: { frId: string }) {
  const meta = getAutomationMeta(frId);
  if (!meta) {
    return null;
  }
  return (
    <Badge
      title={meta.swap_point ? `향후 교체 지점: ${meta.swap_point}` : undefined}
      className={cn(
        "rounded-full px-2.5 py-0.5 font-semibold tracking-normal normal-case",
        LEVEL_STYLE[meta.level],
      )}
    >
      [{meta.level}]
    </Badge>
  );
}
