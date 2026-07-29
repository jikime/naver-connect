"use client";

import { MessageCircle, Send, Users } from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMeetupSessionStore } from "@/stores/meetup-session";
import type { Meetup, MeetupChatMessage } from "@/types";

function readableTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `CHAT-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function MeetupChatDialog({
  meetup,
  viewerId,
  viewerName,
  enabled,
  participants,
  messages,
}: {
  meetup: Meetup;
  viewerId: string;
  viewerName: string;
  enabled: boolean;
  participants: { id: string; name: string }[];
  messages: MeetupChatMessage[];
}) {
  const sendChatMessage = useMeetupSessionStore(
    (state) => state.sendChatMessage,
  );
  const [open, setOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const messageLogRef = useRef<HTMLDivElement>(null);
  const trimmedMessage = messageBody.trim();

  useEffect(() => {
    if (!open || messages.length === 0 || !messageLogRef.current) return;
    messageLogRef.current.scrollTop = messageLogRef.current.scrollHeight;
  }, [messages.length, open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || !trimmedMessage) return;
    sendChatMessage({
      id: createMessageId(),
      meetup_id: meetup.id,
      sender_id: viewerId,
      sender_name: viewerName,
      body: trimmedMessage,
      sent_at: new Date().toISOString(),
    });
    setMessageBody("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={!enabled}>
          <MessageCircle aria-hidden />
          모둠 채팅
          {messages.length > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-semibold text-primary">
              {messages.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-guud-hairline px-6 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">{meetup.title}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden />
                참여자 {participants.length}명 ·{" "}
                {participants.map((participant) => participant.name).join(", ")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={messageLogRef}
          role="log"
          aria-live="polite"
          aria-label={`${meetup.title} 채팅 메시지`}
          className="h-[22rem] overflow-y-auto bg-muted/35 px-5 py-5"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm">
                <MessageCircle className="size-5" aria-hidden />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">
                첫 메시지를 남겨보세요
              </p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-guud-text-muted-2">
                모둠의 첫 인사를 나누거나 함께 이야기할 주제를 제안해보세요.
              </p>
            </div>
          ) : (
            <ol className="space-y-4">
              {messages.map((message) => {
                const isMine = message.sender_id === viewerId;
                return (
                  <li
                    key={message.id}
                    className={cn(
                      "flex flex-col",
                      isMine ? "items-end" : "items-start",
                    )}
                  >
                    <p className="mb-1 px-1 text-[0.6875rem] font-medium text-guud-text-muted-2">
                      {isMine ? "나" : message.sender_name}
                    </p>
                    <div
                      className={cn(
                        "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                        isMine
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-guud-hairline bg-background text-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.body}
                      </p>
                    </div>
                    <time
                      dateTime={message.sent_at}
                      className="mt-1 px-1 text-[0.625rem] text-guud-text-muted-2"
                    >
                      {readableTime(message.sent_at)}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-guud-hairline bg-background p-4"
        >
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                rows={2}
                placeholder="모둠 참여자에게 메시지를 남겨보세요"
                aria-label="채팅 메시지"
                className="max-h-32 min-h-11 resize-none"
              />
              <p className="mt-1 text-right text-[0.625rem] text-guud-text-muted-2">
                {messageBody.length}/500
              </p>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!trimmedMessage}
              aria-label="메시지 보내기"
            >
              <Send aria-hidden />
            </Button>
          </div>
          <p className="mt-1 text-[0.625rem] text-guud-text-muted-2">
            Enter로 전송 · Shift+Enter로 줄바꿈
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
