"use client";

import { Building2, Check, ShieldCheck, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getDemoAccount, useAuthSessionStore } from "@/stores/auth-session";
import type { ViewerContext } from "@/types";

const MEMBER_ROLES = [
  {
    role: "기업가" as const,
    label: "기업가",
    description: "협업 파트너와 사업 기회를 찾습니다",
    icon: Building2,
  },
  {
    role: "전문가" as const,
    label: "전문가",
    description: "전문성을 필요한 현장과 연결합니다",
    icon: Users,
  },
];

export function LoginPanel() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const signIn = useAuthSessionStore((state) => state.signIn);
  const [role, setRole] = useState<ViewerContext["role"]>("기업가");
  const initialAccount = getDemoAccount("기업가");
  const [email, setEmail] = useState(initialAccount.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function selectRole(nextRole: ViewerContext["role"]) {
    const account = getDemoAccount(nextRole);
    setRole(nextRole);
    setEmail(account.email);
    setPassword("");
    setError(null);
  }

  function finishLogin(nextRole: ViewerContext["role"]) {
    const account = getDemoAccount(nextRole);
    signIn(account.user);
    router.push(account.user.onboardingComplete ? "/home" : "/onboarding");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = getDemoAccount(role);
    if (
      email.trim().toLowerCase() !== account.email ||
      password !== account.password
    ) {
      setError("이메일 또는 비밀번호를 확인해주세요.");
      return;
    }
    finishLogin(role);
  }

  const activeAccount = getDemoAccount(role);

  return (
    <div className="grid overflow-hidden rounded-3xl border border-guud-hairline bg-card lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="flex flex-col justify-between bg-foreground p-8 text-background sm:p-10">
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
            역할에 맞는 계정으로 로그인하면 기존 프로필과 추천, 협업 현황을
            이어서 확인할 수 있어요.
          </p>
        </div>
        <ul className="mt-12 space-y-3 text-sm text-background/80">
          {[
            "개인화된 주간 추천",
            "기회·사업 실행 메뉴",
            "역할에 맞는 정보 공개 범위",
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
              회원 유형을 선택하고 계정 정보를 입력해주세요.
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">
              회원 유형
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {MEMBER_ROLES.map((item) => {
                const Icon = item.icon;
                const active = role === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectRole(item.role)}
                    className={cn(
                      "flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                      active
                        ? "border-primary bg-accent text-foreground"
                        : "border-guud-hairline hover:bg-muted",
                    )}
                  >
                    <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span>
                      <span className="block text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-guud-text-muted-2">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-pressed={role === "운영자"}
              onClick={() => selectRole("운영자")}
              className={cn(
                "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-sm font-medium",
                role === "운영자"
                  ? "border-primary bg-accent text-foreground"
                  : "border-guud-hairline text-guud-text-muted-2 hover:text-foreground",
              )}
            >
              <ShieldCheck className="size-4" />
              운영자 로그인
            </button>
          </fieldset>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={emailId}>이메일</Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>

          <div className="rounded-2xl bg-secondary p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-foreground">
                    심사용 빠른 로그인
                  </p>
                  <p className="mt-1 truncate font-mono text-[0.6875rem] text-guud-text-muted-2">
                    {activeAccount.email} · {activeAccount.password}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => finishLogin(role)}
                >
                  {role} 계정으로 바로 입장
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-guud-text-muted-2">
            아직 계정이 없나요?{" "}
            <Link href="/signup" className="font-semibold text-primary">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
