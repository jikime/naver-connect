// GapCardList — 기회 카드 G1~G3(FR-GR-05). 현상·근거(STAGE_LINK)·관련 주체·재원 후보·
// 제안 액션 구조로 표시한다. 3 CTA는 GapCardCTAs(T-019 별도 컴포넌트)가 맡는다.
// 근거: ARCHITECTURE.md §3(L3 GapCardList), TASKS.md T-019, BR-08(STAGE_LINK 근거)·BR-11(재원 유니온)

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GapCard, StageLink } from "@/types";
import { GapCardCTAs } from "./GapCardCTAs";
import { resolveCandidateResource, stageLabel } from "./lookups";

export function GapCardList({
  gapCards,
  stageLinks,
  memberNames,
}: {
  gapCards: GapCard[];
  stageLinks: StageLink[];
  memberNames: Map<string, string>;
}) {
  const stageLinkById = new Map(stageLinks.map((link) => [link.id, link]));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {gapCards.map((card) => (
        <Card key={card.id} className="ring-1 ring-border">
          <CardHeader>
            <p className="text-xs font-semibold text-guud-text-muted-2">
              {card.id} · 연결 {card.connection_count}건
            </p>
            <CardTitle className="normal-case tracking-normal">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <section>
              <h4 className="text-xs font-semibold text-guud-text-muted-2">
                현상
              </h4>
              <p className="mt-1 text-foreground">{card.phenomenon}</p>
            </section>

            <section>
              <h4 className="text-xs font-semibold text-guud-text-muted-2">
                근거(STAGE_LINK)
              </h4>
              <ul className="mt-1 space-y-1">
                {card.stage_link_basis.map((linkId) => {
                  const link = stageLinkById.get(linkId);
                  if (!link) return null;
                  return (
                    <li
                      key={linkId}
                      className="border border-guud-hairline px-2 py-1 text-xs text-guud-text-muted-2"
                    >
                      <span className="font-semibold text-foreground">
                        #{link.id} {link.status}
                      </span>{" "}
                      {stageLabel(link.from_stage)} →{" "}
                      {stageLabel(link.to_stage)} ({link.resource_flow}) —{" "}
                      {link.rationale}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h4 className="text-xs font-semibold text-guud-text-muted-2">
                관련 주체
              </h4>
              <ul className="mt-1 space-y-0.5">
                {card.related_members.map((rm) => (
                  <li key={rm.member_id} className="text-foreground">
                    {memberNames.get(rm.member_id) ?? rm.member_id}
                    <span className="text-guud-text-muted-2"> — {rm.role}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-xs font-semibold text-guud-text-muted-2">
                재원 후보
              </h4>
              <ul className="mt-1 space-y-0.5">
                {card.candidate_resources.map((resId) => {
                  const resolved = resolveCandidateResource(resId);
                  if (!resolved) return <li key={resId}>{resId}</li>;
                  const label =
                    resolved.kind === "resource"
                      ? resolved.item.name
                      : resolved.item.target_requirement;
                  return (
                    <li key={resId} className="text-foreground">
                      {label}
                      <span className="text-guud-text-muted-2">
                        {" "}
                        (
                        {resolved.kind === "resource"
                          ? resolved.item.nature
                          : `공고 · ${resolved.item.deadline} 마감`}
                        )
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h4 className="text-xs font-semibold text-guud-text-muted-2">
                제안 액션
              </h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-foreground">
                {card.actions.map((action) => (
                  <li key={`${card.id}-${action.type}`}>
                    <span className="font-medium">{action.type}</span> —{" "}
                    {action.desc}
                  </li>
                ))}
              </ul>
            </section>

            <GapCardCTAs gapCard={card} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
