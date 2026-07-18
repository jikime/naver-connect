// DealRoomCard — 딜룸 1건 카드. source_type(유입 경로) + G1~G4 게이트 상태를 표시해
// 4입구(핫리드/격차기회카드/모임/외부공고/공고역방향)→씨앗 층 연결을 시각화한다.
// 근거: ARCHITECTURE.md §3(L2 DealBoard), TASKS.md T-020, FR-DR-01/02/03

import { GateStatusBadge } from "@/components/shared/GateStatusBadge";
import { HotLeadBadge } from "@/components/shared/HotLeadBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import membersSeed from "@/data/members.json";
import organizationsSeed from "@/data/organizations.json";
import { cn } from "@/lib/utils";
import type { DealRoom } from "@/types";

type OrgSeed = { id: string; name: string; member_id: string | null };
type MemberSeed = { id: string; name: string };

const organizations = organizationsSeed as OrgSeed[];
const members = membersSeed as MemberSeed[];

const SOURCE_TYPE_LABEL: Record<DealRoom["source_type"], string> = {
  핫리드: "핫리드 진입",
  격차기회카드: "격차 기회카드 진입",
  모임: "모임 진입",
  외부공고: "외부공고 진입",
  공고역방향: "공고 역방향 진입",
};

/** participating_orgs로 조직명을 붙인다. organizations.json은 비민감 시드라 직접 참조 가능(ADR-03 대상 밖). */
function resolveOrgNames(orgIds: string[]): string[] {
  return orgIds
    .map((id) => organizations.find((org) => org.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

/** source_type이 핫리드일 때 참여 조직의 소속 회원을 역추적해 "누구의 씨앗"인지 밝힌다(층 연결). */
function resolveHotLeadMemberName(orgIds: string[]): string | null {
  for (const orgId of orgIds) {
    const org = organizations.find((o) => o.id === orgId);
    if (org?.member_id) {
      const member = members.find((m) => m.id === org.member_id);
      if (member) return member.name;
    }
  }
  return null;
}

export function DealRoomCard({ room }: { room: DealRoom }) {
  const orgNames = resolveOrgNames(room.participating_orgs);
  const hotLeadMemberName =
    room.source_type === "핫리드"
      ? resolveHotLeadMemberName(room.participating_orgs)
      : null;

  return (
    <Card
      size="sm"
      className={cn(
        room.source_type === "핫리드" && "ring-2 ring-destructive/40",
      )}
    >
      <CardHeader>
        <CardTitle className="text-sm normal-case tracking-normal">
          {room.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {room.source_type === "핫리드" && <HotLeadBadge />}
          <Badge className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-semibold tracking-normal text-foreground normal-case">
            {SOURCE_TYPE_LABEL[room.source_type]}
          </Badge>
        </div>
        {hotLeadMemberName && (
          <p className="text-xs text-guud-text-muted-2">
            <span className="font-semibold text-foreground">
              {hotLeadMemberName}
            </span>
            님의 핫리드에서 시작된 씨앗입니다.
          </p>
        )}
        <p className="text-xs text-muted-foreground">{room.source_ref}</p>
        <div className="flex flex-wrap gap-1.5">
          {(["G1", "G2", "G3", "G4"] as const).map((gate) => (
            <GateStatusBadge
              key={gate}
              gate={gate}
              state={room.gate_status[gate]}
            />
          ))}
        </div>
        {orgNames.length > 0 && (
          <p className="text-xs text-guud-text-muted-2">
            참여 조직: {orgNames.join(", ")}
          </p>
        )}
        <p className="border-t border-guud-hairline pt-2 text-xs text-guud-text-subtle">
          {room.agreement_doc.note}
        </p>
      </CardContent>
    </Card>
  );
}
