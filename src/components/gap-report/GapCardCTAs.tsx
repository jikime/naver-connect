"use client";

// GapCardCTAs — 기회 카드 3 CTA(FR-GR-06) + "3단계 협업지원" 선택 시 딜룸 씨앗 내비(FR-GR-07).
// 근거: ARCHITECTURE.md §3(L3 GapCardCTAs), TASKS.md T-019
// FR-GR-06은 "각 카드는 3 CTA를 제공"을 요구한다 — gapCard.actions(제안 액션 서술)에
// 해당 타입이 없어도(G2/G3는 3단계협업지원 서술이 없음) 버튼 3개는 항상 노출한다.
// 추천발송·모듬개설은 백엔드가 없어(§7 Out of Scope) 접수 안내만 표시하는 목업 인터랙션이다.
// 딜룸 라우트가 아직 없어도 링크는 걸어둔다(TASKS.md Project Structure: /deal-rooms).

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GapCard } from "@/types";

type CtaType = "추천발송" | "모듬개설" | "3단계협업지원";

const CTA_LABELS: Record<CtaType, string> = {
  추천발송: "추천 발송",
  모듬개설: "모듬 개설",
  "3단계협업지원": "3단계 협업지원",
};

const MOCK_ACK: Record<"추천발송" | "모듬개설", string> = {
  추천발송: "추천 발송 요청을 접수했습니다(목업 — 실제 발송 없음).",
  모듬개설: "모듬 개설 요청을 접수했습니다(목업 — 실제 개설 없음).",
};

export function GapCardCTAs({ gapCard }: { gapCard: GapCard }) {
  const [ackType, setAckType] = useState<"추천발송" | "모듬개설" | null>(null);
  const actionByType = new Map(
    gapCard.actions.map((action) => [action.type, action.desc]),
  );

  return (
    <div className="border-t border-guud-hairline pt-3">
      <div className="flex flex-wrap gap-2">
        {(["추천발송", "모듬개설"] as const).map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            title={actionByType.get(type) ?? CTA_LABELS[type]}
            onClick={() => setAckType(type)}
          >
            {CTA_LABELS[type]}
          </Button>
        ))}
        <Button asChild variant="default" size="sm">
          <Link
            href={`/deal-rooms?seed=${gapCard.id}`}
            title={
              actionByType.get("3단계협업지원") ??
              "3단계 협업지원 — 딜룸 씨앗으로 이동"
            }
          >
            3단계 협업지원 → 딜룸 씨앗
          </Link>
        </Button>
      </div>
      {ackType && (
        <output className="mt-2 block text-xs text-guud-text-muted-2">
          {MOCK_ACK[ackType]}
        </output>
      )}
    </div>
  );
}
