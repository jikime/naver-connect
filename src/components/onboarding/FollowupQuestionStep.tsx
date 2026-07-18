"use client";

// FollowupQuestionStep — AI 후속질문 챗봇 UI(FR-ON-05/06/09/11).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009b
// 정적 스크립트(interview_scripts.json)를 1턴 1질문으로 진행한다. 최우선수요1+나머지수요1+공급1
// (핫리드는 +3 심화질문). 무응답/공백이면 동일 질문을 1회만 재질문하고, 그래도 비어 있으면
// 진행한다(FR-ON-11). 답변은 detail_quote로 원문 그대로 보존한다(BR-02, 요약·윤색 금지).
// FR-ON-10: 이 정적 분기는 향후 LLM 후속질문 생성기로 교체될 지점이다(AutomationLevelBadge 참조).

import { useState } from "react";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FollowupQueueItem {
  id: string;
  kind: "demand" | "supply" | "hot_lead";
  tagId?: number;
  question: string;
}

function BotBubble({ text }: { text: string }) {
  return (
    <div className="max-w-[85%] rounded-none border border-guud-hairline bg-muted px-3 py-2 text-sm text-foreground">
      {text}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="ml-auto max-w-[85%] border border-primary bg-primary/5 px-3 py-2 text-sm text-foreground">
      {text.length > 0 ? (
        text
      ) : (
        <span className="italic text-guud-text-muted-2">(무응답)</span>
      )}
    </div>
  );
}

export function FollowupQuestionStep({
  queue,
  onAnswer,
  onComplete,
  done,
}: {
  queue: FollowupQueueItem[];
  onAnswer: (item: FollowupQueueItem, answer: string) => void;
  onComplete: () => void;
  done: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [retriedAt, setRetriedAt] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");

  if (queue.length === 0) {
    return (
      <p className="text-sm text-guud-text-muted-2">
        후속질문 대상 태그가 없어요. 다음 단계로 진행해주세요.
      </p>
    );
  }

  function handleSubmit() {
    const trimmed = inputValue.trim();
    if (trimmed.length === 0 && retriedAt !== index) {
      setRetriedAt(index);
      return;
    }
    const item = queue[index];
    onAnswer(item, trimmed);
    setAnswers((prev) => [...prev, trimmed]);
    setInputValue("");
    setRetriedAt(null);
    const nextIndex = index + 1;
    setIndex(nextIndex);
    if (nextIndex >= queue.length) {
      onComplete();
    }
  }

  const finished = index >= queue.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-guud-text-muted-2">
          한 번에 한 질문씩 여쭤볼게요. 편하게 답해주세요.
        </p>
        <AutomationLevelBadge frId="FR-ON-06" />
      </div>

      <div className="space-y-3">
        {queue.slice(0, index).map((item, i) => (
          <div key={item.id} className="space-y-1.5">
            <BotBubble text={item.question} />
            <UserBubble text={answers[i] ?? ""} />
          </div>
        ))}

        {!finished && (
          <div className="space-y-1.5">
            <BotBubble text={queue[index].question} />
            {retriedAt === index && (
              <p className="pl-1 text-xs text-guud-text-muted-2">
                답이 비어 있어요. 한 번만 더 여쭤볼게요 — 그냥 전송하면 다음으로
                넘어가요.
              </p>
            )}
            <div className="flex gap-2">
              <Textarea
                aria-label="답변 입력"
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={handleSubmit} className="self-end">
                전송
              </Button>
            </div>
          </div>
        )}

        {finished && (
          <p
            className={cn(
              "text-sm font-semibold",
              done ? "text-foreground" : "text-guud-text-muted-2",
            )}
          >
            질문이 모두 끝났어요. 다음 단계로 진행해주세요.
          </p>
        )}
      </div>
    </div>
  );
}
