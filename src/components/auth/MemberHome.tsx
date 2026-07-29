"use client";

import {
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  ClipboardPenLine,
  Network,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useAuthSessionStore } from "@/stores/auth-session";

const MEMBER_ACTIONS = [
  {
    href: "/onboarding",
    label: "연결 프로필 만들기",
    description: "내 활동과 필요한 연결을 입력해 추천 기준을 업데이트해요.",
    icon: ClipboardPenLine,
  },
  {
    href: "/recommendations",
    label: "이번 주 추천",
    description: "나와 연결 가능성이 높은 회원을 확인해요.",
    icon: Sparkles,
  },
  {
    href: "/profile",
    label: "내 프로필",
    description: "공개 정보와 협업 수요를 점검해요.",
    icon: UserRound,
  },
  {
    href: "/gap-report",
    label: "사업기회 발굴",
    description: "지역과 분야의 빈틈에서 기회를 찾아요.",
    icon: Search,
  },
  {
    href: "/deal-rooms",
    label: "딜룸",
    description: "진행 중인 협업을 실행 단계별로 관리해요.",
    icon: BriefcaseBusiness,
  },
];

const OPERATOR_ACTIONS = [
  {
    href: "/operator/review",
    label: "추천 검수",
    description: "회원에게 전달될 추천을 검토하고 승인해요.",
    icon: ClipboardCheck,
  },
  {
    href: "/operator/kpi",
    label: "KPI 현황",
    description: "연결과 협업 성과를 목표선과 비교해요.",
    icon: BarChart3,
  },
  {
    href: "/admin/rules",
    label: "추천 룰",
    description: "매칭 키워드와 가중치를 관리해요.",
    icon: SlidersHorizontal,
  },
  {
    href: "/knowledge-graph",
    label: "지식 그래프",
    description: "회원과 조직, 사업의 연결 구조를 살펴봐요.",
    icon: Network,
  },
];

export function MemberHome() {
  const user = useAuthSessionStore((state) => state.user);
  if (!user) return null;

  const actions = user.role === "운영자" ? OPERATOR_ACTIONS : MEMBER_ACTIONS;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
            [ MEMBER HOME · {user.role} ]
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {user.name}님, 오늘은 어떤{" "}
                <span className="text-primary">연결</span>을 만들까요?
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-guud-text-muted-2">
                프로필을 바탕으로 추천을 확인하고, 발견한 기회를 실제 협업으로
                이어가보세요.
              </p>
            </div>
            <span className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground">
              {user.role === "운영자" ? "운영 모드" : "온보딩 완료"}
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-12 sm:px-10 lg:px-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.625rem] tracking-[0.14em] text-guud-text-muted-2 uppercase">
              [ QUICK START ]
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">
              바로 시작하기
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {actions.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-56 flex-col justify-between rounded-2xl border border-guud-hairline bg-card p-5 transition-colors hover:bg-secondary"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary group-hover:bg-background">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-[0.625rem] text-guud-text-muted-2">
                    0{index + 1}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {item.label}
                    </h3>
                    <ArrowUpRight className="size-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-guud-text-muted-2">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
