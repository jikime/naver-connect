"use client";

// FollowupQuestionStep — AI 후속질문 챗봇 UI(FR-ON-05/06/09/11).
// 근거: ARCHITECTURE.md §3(L2 OnbWizard), TASKS.md T-009b
// 정적 스크립트(interview_scripts.json)를 1턴 1질문으로 진행한다. 최우선수요1+나머지수요1+공급1
// (핫리드는 +3 심화질문). 무응답/공백이면 동일 질문을 1회만 재질문하고, 그래도 비어 있으면
// 진행한다(FR-ON-11). 답변은 detail_quote로 원문 그대로 보존한다(BR-02, 요약·윤색 금지).
// FR-ON-10: 이 정적 분기는 향후 LLM 후속질문 생성기로 교체될 지점이다(AutomationLevelBadge 참조).

import { CheckCircle2, MessageCircle, Send, Sparkles } from "lucide-react";
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
  exampleAnswer?: string;
}

function BotBubble({
  text,
  exampleAnswer,
}: {
  text: string;
  exampleAnswer?: string;
}) {
  return (
    <div className="flex max-w-[92%] items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        <MessageCircle className="size-4" />
      </span>
      <div className="rounded-2xl rounded-tl-sm border border-guud-hairline bg-background px-4 py-3 text-sm leading-6 text-foreground shadow-sm">
        <p>{text}</p>
        {exampleAnswer && (
          <p className="mt-2 border-t border-guud-hairline pt-2 text-xs leading-5 text-guud-text-muted-2">
            예: {exampleAnswer}
          </p>
        )}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-foreground px-4 py-3 text-sm leading-6 text-background">
      {text.length > 0 ? text : <span className="italic">(답변 건너뜀)</span>}
    </div>
  );
}

export function FollowupQuestionStep({
  queue,
  onAnswer,
  onComplete,
  done,
  isHotLead,
}: {
  queue: FollowupQueueItem[];
  onAnswer: (item: FollowupQueueItem, answer: string) => void;
  onComplete: () => void;
  done: boolean;
  isHotLead: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [retriedAt, setRetriedAt] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl bg-muted p-5 text-sm text-guud-text-muted-2">
        후속질문 대상 태그가 없어요. 다음 단계로 진행해주세요.
      </div>
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
    <div className="space-y-6">
      <div className="rounded-2xl bg-secondary/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              한 문장이면 충분해요
            </p>
            <AutomationLevelBadge frId="FR-ON-06" />
          </div>
          <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-guud-text-muted-2">
            {Math.min(index + 1, queue.length)} / {queue.length}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-guud-text-muted-2">
          답변은 요약하거나 꾸미지 않고 작성한 문장 그대로 보존합니다.
          {isHotLead &&
            " 구체적인 프로젝트가 있어 파트너와 진행 단계를 추가로 여쭤볼게요."}
        </p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${(index / queue.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-h-[32rem] space-y-4 overflow-y-auto rounded-2xl bg-muted/50 p-4 sm:p-5">
        {queue.slice(0, index).map((item, i) => (
          <div key={item.id} className="space-y-3">
            <BotBubble
              text={item.question}
              exampleAnswer={item.exampleAnswer}
            />
            <UserBubble text={answers[i] ?? ""} />
          </div>
        ))}

        {!finished && (
          <div className="space-y-3">
            <BotBubble
              text={queue[index].question}
              exampleAnswer={queue[index].exampleAnswer}
            />
            {retriedAt === index && (
              <p className="pl-11 text-xs leading-5 text-guud-text-muted-2">
                답이 비어 있어요. 한 번만 더 여쭤볼게요 — 그냥 전송하면 다음으로
                넘어가요.
              </p>
            )}
            <div className="ml-0 flex flex-col gap-2 sm:ml-11 sm:flex-row">
              <Textarea
                aria-label="답변 입력"
                rows={3}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="편한 말로 한 문장만 적어주세요"
                className="flex-1 bg-background"
              />
              <Button
                type="button"
                onClick={handleSubmit}
                className="self-stretch sm:self-end"
              >
                전송 <Send className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {finished && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold",
              done
                ? "border-primary/30 bg-secondary text-foreground"
                : "border-guud-hairline text-guud-text-muted-2",
            )}
          >
            <CheckCircle2 className="size-5 text-primary" />
            질문이 모두 끝났어요. 이제 프로필을 확인해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
