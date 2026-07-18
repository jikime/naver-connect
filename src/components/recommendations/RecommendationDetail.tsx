"use client";

// RecommendationDetail — 추천 상세 카드. 5문장 구조 + 매칭유형 배지 + [만나볼래요]/[이번엔 패스] CTA.
// 근거: ARCHITECTURE.md §3(L2 RecDetail), TASKS.md T-013/T-014, FR-RC-03/04/05/06/07, FR-FB-01~04

import { useCallback, useEffect, useState } from "react";
import { AssumptionBadge } from "@/components/shared/AssumptionBadge";
import { HotLeadBadge } from "@/components/shared/HotLeadBadge";
import { MatchTypeBadge } from "@/components/shared/MatchTypeBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDeclineReasons, getMember, getRecommendation } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { DeclineReason, MaskedMember, Recommendation } from "@/types";
import { DeclineReasonPanel } from "./DeclineReasonPanel";
import { MeetingOutcomeForm } from "./MeetingOutcomeForm";
import { RecommendationMessage } from "./RecommendationMessage";

type Mode = "idle" | "declining" | "meeting";

export function RecommendationDetail({ id }: { id: string }) {
  const vc = useViewerContext();
  const [rec, setRec] = useState<Recommendation | null | "not-found">(null);
  const [reasons, setReasons] = useState<DeclineReason[]>([]);
  const [fromMember, setFromMember] = useState<MaskedMember | null>(null);
  const [toMember, setToMember] = useState<MaskedMember | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  const reload = useCallback(async () => {
    try {
      const [nextRec, nextReasons] = await Promise.all([
        getRecommendation(vc, id),
        getDeclineReasons(),
      ]);
      setRec(nextRec);
      setReasons(nextReasons);
      const [from, to] = await Promise.all([
        getMember(vc, nextRec.from_member_id).catch(() => null),
        nextRec.to_member_id
          ? getMember(vc, nextRec.to_member_id).catch(() => null)
          : Promise.resolve(null),
      ]);
      setFromMember(from);
      setToMember(to);
    } catch {
      setRec("not-found");
    }
  }, [vc, id]);

  useEffect(() => {
    setMode("idle");
    void reload();
  }, [reload]);

  if (rec === null) {
    return (
      <p className="px-[30px] py-6 text-sm text-guud-text-muted-2">
        추천 상세를 불러오는 중입니다…
      </p>
    );
  }

  if (rec === "not-found") {
    return (
      <p className="px-[30px] py-6 text-sm text-guud-text-muted-2">
        해당 추천을 찾을 수 없습니다.
      </p>
    );
  }

  const declinedReason = rec.decline_reason
    ? reasons.find((r) => r.code === rec.decline_reason)
    : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl px-[30px] py-6">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <MatchTypeBadge type={rec.match_type} />
            <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
              {rec.value_class}
            </Badge>
            {rec.is_hot_lead && <HotLeadBadge />}
            {rec.rec_kind === "모듬" && (
              <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
                모듬
              </Badge>
            )}
          </div>
          {(fromMember || toMember) && (
            <p className="text-xs text-guud-text-muted-2">
              {fromMember?.name ?? "?"} → {toMember?.name ?? "(모듬 참여자)"}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <RecommendationMessage rec={rec} />

          {rec.status === "declined" && (
            <div className="border border-guud-hairline bg-muted p-4 text-sm">
              <p className="font-semibold text-foreground">이번엔 패스했어요</p>
              {declinedReason && (
                <p className="mt-1 text-guud-text-muted-2">
                  사유: {declinedReason.label} · 반영:{" "}
                  {declinedReason.engine_effect} — {declinedReason.effect_desc}
                </p>
              )}
              {rec.decline_note && (
                <p className="mt-1 text-guud-text-muted-2">
                  메모: {rec.decline_note}
                </p>
              )}
            </div>
          )}

          {rec.meeting_outcome && (
            <div className="border border-guud-hairline bg-muted p-4 text-sm">
              <p className="font-semibold text-foreground">
                만남 후기가 등록됐어요
              </p>
              <p className="mt-1 text-guud-text-muted-2">
                {rec.meeting_outcome.met ? "성사됨" : "아직 성사 전"} · 재만남
                의향: {rec.meeting_outcome.will_meet_again ? "있음" : "없음"}
                <AssumptionBadge />
              </p>
              {rec.meeting_outcome.note && (
                <p className="mt-1 text-guud-text-muted-2">
                  {rec.meeting_outcome.note}
                </p>
              )}
            </div>
          )}

          {rec.status !== "declined" && !rec.meeting_outcome && (
            <>
              {mode === "idle" && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setMode("meeting")}>만나볼래요</Button>
                  <Button
                    variant="outline"
                    onClick={() => setMode("declining")}
                  >
                    이번엔 패스할게요
                  </Button>
                </div>
              )}
              {mode === "declining" && (
                <DeclineReasonPanel
                  vc={vc}
                  recId={rec.id}
                  reasons={reasons}
                  onCancel={() => setMode("idle")}
                  onSubmitted={() => {
                    setMode("idle");
                    void reload();
                  }}
                />
              )}
              {mode === "meeting" && (
                <MeetingOutcomeForm
                  vc={vc}
                  recId={rec.id}
                  onCancel={() => setMode("idle")}
                  onSubmitted={() => {
                    setMode("idle");
                    void reload();
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
