// GapCardList — 기회 카드 G1~G3(FR-GR-05). 현상·근거(STAGE_LINK)·관련 주체(+buying
// power)·협업 사례·재원 후보·제안 액션 구조로 표시한다. 3 CTA는 GapCardCTAs(T-019
// 별도 컴포넌트)가 맡는다.
// 근거: ARCHITECTURE.md §3(L3 GapCardList), TASKS.md T-019, BR-08(STAGE_LINK 근거)·BR-11(재원 유니온)
// v1.1: FR-GR-08(buying power) · FR-GR-09(협업 사례 인라인) · FR-GR-10(프로젝트 제안 연결)

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CollabCase,
  GapCard,
  Organization,
  ProjectProposal,
  StageLink,
} from "@/types";
import { GapCardCTAs } from "./GapCardCTAs";
import { resolveCandidateResource, stageLabel } from "./lookups";

export function GapCardList({
  gapCards,
  stageLinks,
  memberNames,
  orgs,
  collabCases,
  proposals,
}: {
  gapCards: GapCard[];
  stageLinks: StageLink[];
  memberNames: Map<string, string>;
  orgs: Organization[];
  collabCases: CollabCase[];
  proposals: ProjectProposal[];
}) {
  const stageLinkById = new Map(stageLinks.map((link) => [link.id, link]));
  const orgByMemberId = new Map(
    orgs.filter((o) => o.member_id).map((o) => [o.member_id as string, o]),
  );

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
                {card.related_members.map((rm) => {
                  const org = orgByMemberId.get(rm.member_id);
                  return (
                    <li key={rm.member_id} className="text-foreground">
                      {memberNames.get(rm.member_id) ?? rm.member_id}
                      <span className="text-guud-text-muted-2">
                        {" "}
                        — {rm.role}
                        {org ? ` · buying power ${org.buying_power}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <GapCardCollabAndProposals
              card={card}
              orgs={orgs}
              collabCases={collabCases}
              proposals={proposals}
            />

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

/**
 * 협업 사례(FR-GR-09)·프로젝트 제안 연결(FR-GR-10) — 기회 카드의 related_members가
 * 속한 조직(member_id로 매칭)이 참여한 협업 사례, 그리고 그 카드/사례를 근거로 만든
 * project_proposals(basis.ref==="GapCard {id}" 또는 매칭된 협업사례 id)를 함께 보여준다.
 * G3처럼 매칭이 없으면 "관련 협업 사례 없음"이 곧 그 축의 공백을 다시 확인해준다.
 */
function GapCardCollabAndProposals({
  card,
  orgs,
  collabCases,
  proposals,
}: {
  card: GapCard;
  orgs: Organization[];
  collabCases: CollabCase[];
  proposals: ProjectProposal[];
}) {
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const relatedMemberIds = new Set(
    card.related_members.map((rm) => rm.member_id),
  );

  const matchedCases = collabCases.filter((c) =>
    c.participant_org_ids.some((orgId) => {
      const org = orgById.get(orgId);
      return org?.member_id && relatedMemberIds.has(org.member_id);
    }),
  );
  const matchedCaseIds = new Set(matchedCases.map((c) => c.id));

  const relatedProposals = proposals.filter(
    (p) =>
      (p.basis.type === "생태계맵" && p.basis.ref === `GapCard ${card.id}`) ||
      (p.basis.type === "협업사례" && matchedCaseIds.has(p.basis.ref)),
  );

  return (
    <section>
      <h4 className="text-xs font-semibold text-guud-text-muted-2">
        협업 사례 · 관련 제안
      </h4>
      {matchedCases.length > 0 ? (
        <ul className="mt-1 space-y-1">
          {matchedCases.map((c) => (
            <li
              key={c.id}
              className="border border-guud-hairline px-2 py-1 text-xs"
            >
              <span className="font-semibold text-foreground">{c.title}</span>{" "}
              <span className="text-guud-text-muted-2">
                ({c.status} · {c.period})
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-guud-text-muted-2">
          관련 협업 사례 없음 — 이 축은 아직 실제 협업 선례가 없습니다.
        </p>
      )}
      {relatedProposals.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {relatedProposals.map((p) => (
            <li key={p.id} className="text-xs">
              <Link
                href="/proposals"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                제안: {p.title}
              </Link>{" "}
              <span className="text-guud-text-muted-2">({p.track_status})</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
