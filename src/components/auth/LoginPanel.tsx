"use client";

import { Building2, Check, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REVIEW_ACCOUNTS } from "@/lib/auth/review-accounts";
import type { UserRole } from "@/lib/auth/types";

const REVIEW_ROLE_META: Record<
  UserRole,
  { description: string; icon: typeof Building2 }
> = {
  기업가: {
    description: "추천과 사업 기회를 확인합니다",
    icon: Building2,
  },
  전문가: {
    description: "전문 서비스와 협업 요청을 확인합니다",
    icon: Users,
  },
  운영자: {
    description: "검토 대기열과 운영 화면을 확인합니다",
    icon: ShieldCheck,
  },
};

interface LoginPanelProps {
  showReviewAccounts?: boolean;
}

export function LoginPanel({ showReviewAccounts = false }: LoginPanelProps) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!result.ok) {
        setError("이메일 또는 비밀번호를 확인해주세요.");
        return;
      }
      router.replace("/home");
      router.refresh();
    } catch {
      setError("로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid overflow-hidden rounded-3xl border border-guud-hairline bg-card lg:grid-cols-[0.88fr_1.12fr]">
      <aside className="flex flex-col bg-foreground p-6 text-background sm:p-10">
        <div className="space-y-5">
          <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-background/60 uppercase">
            [ WELCOME BACK ]
          </p>
          <h1 className="font-heading text-3xl leading-tight font-semibold sm:text-4xl">
            다시 연결을
            <br />
            시작해볼까요?
          </h1>
          <p className="max-w-sm text-sm leading-6 text-background/70">
            가입한 이메일로 로그인하면 프로필과 협업 활동을 안전하게 이어서
            확인할 수 있어요.
          </p>
        </div>
        <figure className="mt-8 overflow-hidden rounded-2xl border border-background/15 bg-background/5 p-1.5">
          <Image
            src="/images/auth-welcome-back.webp"
            width={1448}
            height={1086}
            sizes="(max-width: 1023px) calc(100vw - 64px), 38vw"
            loading="eager"
            alt="기존 회원이 협업 동료들의 환영을 받으며 다시 모임으로 돌아오는 모습"
            className="aspect-[16/9] w-full rounded-[calc(var(--radius)*1.2)] object-cover sm:aspect-[4/3]"
          />
        </figure>
        <ul className="mt-8 space-y-3 text-sm text-background/80">
          {[
            "암호화된 로그인 세션",
            "역할별 접근 권한",
            "안전하게 보관되는 프로필",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check className="size-4 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </aside>

      <div className="p-6 sm:p-10">
        <div className="mx-auto max-w-xl space-y-7">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              로그인
            </h2>
            <p className="text-sm text-guud-text-muted-2">
              가입할 때 사용한 이메일과 비밀번호를 입력해주세요.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-busy={submitting}
          >
            <div className="space-y-1.5">
              <Label htmlFor={emailId}>이메일</Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={passwordId}>비밀번호</Label>
              <Input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "로그인하고 있어요…" : "로그인"}
            </Button>
          </form>

          {showReviewAccounts && (
            <section
              aria-labelledby="review-accounts-title"
              className="space-y-3 rounded-2xl border border-primary/25 bg-accent/45 p-4"
            >
              <div>
                <h3
                  id="review-accounts-title"
                  className="text-sm font-semibold text-foreground"
                >
                  심사위원용 테스트 계정
                </h3>
                <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
                  역할별 계정을 선택하면 로그인 정보가 자동으로 입력됩니다.
                </p>
              </div>
              <div className="grid gap-2">
                {REVIEW_ACCOUNTS.map((account) => {
                  const meta = REVIEW_ROLE_META[account.role];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword(account.password);
                        setError(null);
                      }}
                      className="flex items-start gap-3 rounded-xl border border-guud-hairline bg-card px-3 py-3 text-left transition-colors hover:border-primary/50 hover:bg-muted"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <span className="text-sm font-semibold text-foreground">
                            {account.role} · {account.name}
                          </span>
                          <span className="text-[0.6875rem] text-primary">
                            입력하기
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-guud-text-muted-2">
                          {meta.description}
                        </span>
                        <span className="mt-1 block break-all font-mono text-[0.6875rem] text-foreground/75">
                          ID {account.email} · PW {account.password}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
