"use client";

// ReviewQueueDashboard — 생성 추천 전건 검수 큐(승인/반려) + 핫리드 48h 강조.
// 근거: ARCHITECTURE.md §3(L2 ReviewQueueDashboard·L3 HotLeadBadge), TASKS.md T-015,
//       FR-OP-01/02/03/04, BR-05(전건 검수). 비운영자는 getReviewQueue의 403 시뮬(ForbiddenError)을
//       그대로 안내로 보여준다(운영자 전용 접근제어는 클라이언트 시뮬레이션, ADR-03 §9 참조).
//
// 반려는 approveRecommendation과 대칭인 rejectRecommendation(DAL, review.ts)을 거쳐
// status→rejected로 실제 전이된다(세션 스토어 갱신, 서버 호출 없음 NFR-02). 승인과 마찬가지로
// 반려된 건도 다음 getReviewQueue 조회(reload)부터 큐(draft/pending_review)에서 사라진다 —
// 로컬 컴포넌트 상태로 반려 여부를 별도 추적하지 않는다(ARCHITECTURE.md §5.3 사후 동기화).
//
// Task #21 마이크로 인터랙션: 승인/반려 시 카드가 슬라이드 아웃되고(AnimatePresence),
// 그 카드가 있던 자리를 이어받은 다음 카드로 포커스를 옮겨 키보드 사용자가 리스트 맨 위로
// 튕기지 않고 검수를 이어갈 수 있게 한다. 포커스 대상은 카드 자체(tabIndex=-1)다 — 승인
// 버튼은 그 카드의 체크리스트가 아직 미완료면 disabled 상태라 focus()가 no-op이 되므로,
// 항상 포커스 가능한 카드 컨테이너를 landing target으로 쓴다.

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HotLeadBadge } from "@/components/shared/HotLeadBadge";
import { MatchTypeBadge } from "@/components/shared/MatchTypeBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  approveRecommendation,
  getMembers,
  getReviewQueue,
  rejectRecommendation,
} from "@/lib/dal";
import { ForbiddenError } from "@/lib/dal/errors";
import { cn } from "@/lib/utils";
import { useViewerContext } from "@/stores/viewer-context";
import type { MaskedMember, Recommendation, RecStatus } from "@/types";
import { ReviewChecklist } from "./ReviewChecklist";

// 모드 B 회송: {rec.status}를 raw enum(예: "pending_review")으로 그대로 노출하던 것을
// 한글 라벨로 매핑(AI 티 — 미번역 시스템 값 노출).
const STATUS_LABEL: Record<RecStatus, string> = {
  draft: "초안",
  pending_review: "검수 대기",
  sent: "발송됨",
  accepted: "수락됨",
  declined: "거절됨",
  rejected: "반려됨",
};

function sortHotLeadFirst(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort(
    (a, b) => Number(b.is_hot_lead) - Number(a.is_hot_lead),
  );
}

function QueueItem({
  rec,
  memberName,
  onApprove,
  onReject,
  containerRef,
}: {
  rec: Recommendation;
  memberName: (id: string | null) => string;
  onApprove: (recId: string) => void;
  onReject: (recId: string) => void;
  containerRef: (el: HTMLDivElement | null) => void;
}) {
  const [allChecked, setAllChecked] = useState(false);

  return (
    <Card
      ref={containerRef}
      tabIndex={-1}
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        rec.is_hot_lead && "border-l-4 border-l-destructive",
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-1.5">
          <MatchTypeBadge type={rec.match_type} />
          <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
            {rec.rec_kind === "모듬" ? "모듬" : rec.value_class}
          </Badge>
          <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
            {STATUS_LABEL[rec.status]}
          </Badge>
          {rec.is_hot_lead && <HotLeadBadge />}
        </div>
        <p className="text-sm text-guud-text-muted-2">
          {memberName(rec.from_member_id)} → {memberName(rec.to_member_id)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground">{rec.message.intro}</p>
        <ReviewChecklist onAllCheckedChange={setAllChecked} />
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={!allChecked}
            onClick={() => onApprove(rec.id)}
          >
            승인
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject(rec.id)}>
            반려
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReviewQueueDashboard() {
  const vc = useViewerContext();
  const [queue, setQueue] = useState<Recommendation[] | null>(null);
  const [members, setMembers] = useState<MaskedMember[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const pendingFocusIndexRef = useRef<number | null>(null);

  const reload = useCallback(async () => {
    try {
      const [nextQueue, nextMembers] = await Promise.all([
        getReviewQueue(vc),
        getMembers(vc),
      ]);
      setQueue(sortHotLeadFirst(nextQueue));
      setMembers(nextMembers);
      setForbidden(false);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        setForbidden(true);
        setQueue(null);
      }
    }
  }, [vc]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // 승인/반려로 카드 하나가 빠진 뒤, 그 자리를 이어받은 다음 카드로 포커스를 옮긴다.
  useEffect(() => {
    if (pendingFocusIndexRef.current === null || !queue) return;
    const idx = Math.min(pendingFocusIndexRef.current, queue.length - 1);
    pendingFocusIndexRef.current = null;
    const nextId = idx >= 0 ? queue[idx]?.id : undefined;
    if (nextId) {
      cardRefs.current.get(nextId)?.focus();
    }
  }, [queue]);

  function markPendingFocus(recId: string) {
    const order = queue?.map((r) => r.id) ?? [];
    pendingFocusIndexRef.current = order.indexOf(recId);
  }

  function memberName(id: string | null): string {
    if (!id) return "(모듬 참여자)";
    return members.find((m) => m.id === id)?.name ?? id;
  }

  async function handleApprove(recId: string) {
    markPendingFocus(recId);
    await approveRecommendation(vc, recId);
    await reload();
  }

  async function handleReject(recId: string) {
    markPendingFocus(recId);
    await rejectRecommendation(vc, recId);
    await reload();
  }

  if (forbidden) {
    return (
      <div className="mx-6 my-6 border border-guud-hairline bg-muted px-4 py-3 text-sm text-guud-text-muted-2">
        운영자만 접근할 수 있습니다. 상단 역할 스위처에서 “운영자”로 전환해
        주세요(403 시뮬레이션, FR-OP-01).
      </div>
    );
  }

  if (queue === null) {
    return (
      <p className="px-[30px] py-6 text-sm text-guud-text-muted-2">
        검수 큐를 불러오는 중입니다…
      </p>
    );
  }

  return (
    <div className="space-y-8 px-[30px] py-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          검수 대기 {queue.length}건
        </h2>
        {queue.length === 0 ? (
          <p className="text-sm text-guud-text-muted-2">
            검수 대기 중인 추천이 없습니다.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <AnimatePresence initial={false}>
              {queue.map((rec) => (
                <motion.div
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    x: rec.is_hot_lead ? 24 : -24,
                    transition: { duration: 0.18 },
                  }}
                  transition={{ duration: 0.15 }}
                >
                  <QueueItem
                    rec={rec}
                    memberName={memberName}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    containerRef={(el) => {
                      cardRefs.current.set(rec.id, el);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
