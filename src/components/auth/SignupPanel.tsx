"use client";

import { Building2, Check, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuthSessionStore } from "@/stores/auth-session";

const SIGNUP_ROLES = [
  {
    role: "기업가" as const,
    label: "기업가",
    description: "사업과 현장의 문제를 함께 풀 파트너를 찾아요",
    icon: Building2,
  },
  {
    role: "전문가" as const,
    label: "전문가",
    description: "경험과 전문성을 필요한 조직에 연결해요",
    icon: Users,
  },
];

export function SignupPanel() {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const signUp = useAuthSessionStore((state) => state.signUp);
  const [role, setRole] = useState<"기업가" | "전문가">("기업가");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("이름을 두 글자 이상 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호를 8자 이상 입력해주세요.");
      return;
    }
    signUp({ name, email, role });
    router.push("/onboarding");
  }

  return (
    <div className="grid overflow-hidden rounded-3xl border border-guud-hairline bg-card lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="flex flex-col justify-between bg-secondary p-8 sm:p-10">
        <div className="space-y-5">
          <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
            [ JOIN THE NETWORK ]
          </p>
          <h1 className="font-heading text-3xl leading-tight font-semibold text-foreground sm:text-4xl">
            좋은 연결은
            <br />
            나를 설명하는 데서 시작해요.
          </h1>
          <p className="max-w-sm text-sm leading-6 text-guud-text-muted-2">
            가입 후 온보딩에서 조직, 수요, 공급 역량을 확인하면 첫 추천을 받을
            수 있어요.
          </p>
        </div>
        <ol className="mt-12 space-y-4 text-sm text-foreground">
          {["회원 유형 선택", "7단계 온보딩", "프로필 확정과 첫 추천"].map(
            (item, index) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-background font-mono text-xs text-primary">
                  {index + 1}
                </span>
                {item}
              </li>
            ),
          )}
        </ol>
      </aside>

      <div className="p-6 sm:p-10">
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-7">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              회원가입
            </h2>
            <p className="text-sm text-guud-text-muted-2">
              기본 계정을 만든 뒤 바로 온보딩을 시작합니다.
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">
              어떤 회원으로 참여하나요?
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {SIGNUP_ROLES.map((item) => {
                const Icon = item.icon;
                const active = role === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRole(item.role)}
                    className={cn(
                      "relative flex min-h-28 items-start gap-3 rounded-2xl border p-4 text-left",
                      active
                        ? "border-primary bg-accent"
                        : "border-guud-hairline hover:bg-muted",
                    )}
                  >
                    <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-guud-text-muted-2">
                        {item.description}
                      </span>
                    </span>
                    {active && (
                      <Check className="absolute top-3 right-3 size-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={nameId}>이름</Label>
              <Input
                id={nameId}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="홍길동"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={emailId}>이메일</Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={passwordId}>비밀번호</Label>
              <Input
                id={passwordId}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8자 이상"
                minLength={8}
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            가입하고 온보딩 시작
          </Button>
          <p className="text-center text-sm text-guud-text-muted-2">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="font-semibold text-primary">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
