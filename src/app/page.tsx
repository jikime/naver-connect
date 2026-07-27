// 공개 랜딩 — 비회원에게 플랫폼 가치와 가입→온보딩 흐름을 설명한다.

import {
  ArrowRight,
  BriefcaseBusiness,
  Handshake,
  Search,
  UserRoundCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SERVICE_LAYERS = [
  {
    eyebrow: "RELATION",
    title: "관계를 발견하고",
    description:
      "프로필의 미션, 수요, 공급 역량을 바탕으로 지금 만나야 할 기업가와 전문가를 추천합니다.",
    icon: Handshake,
  },
  {
    eyebrow: "OPPORTUNITY",
    title: "기회를 구체화하고",
    description:
      "지역과 분야의 격차, 공공 자원과 회원 네트워크를 함께 보며 실행 가능한 기회를 찾습니다.",
    icon: Search,
  },
  {
    eyebrow: "EXECUTION",
    title: "사업으로 연결합니다",
    description:
      "발견한 파트너와 제안을 딜룸으로 옮겨 협업의 현재 단계와 다음 행동을 관리합니다.",
    icon: BriefcaseBusiness,
  },
];

const ONBOARDING_STEPS = [
  {
    title: "회원 유형 선택",
    description: "기업가 또는 전문가로 가입해 네트워크에서의 역할을 정합니다.",
  },
  {
    title: "프로필 온보딩",
    description:
      "조직 정보와 협업 수요·공급 역량을 확인하고 공개 범위를 정합니다.",
  },
  {
    title: "첫 연결 확인",
    description:
      "프로필을 바탕으로 준비된 추천을 보고 협업 가능성을 탐색합니다.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex min-h-[calc(100svh-64px)] items-center px-5 py-12 sm:px-8 lg:py-16">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-5">
              <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
                [ SOCIAL VENTURE NETWORK · AX ]
              </p>
              <h1 className="font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                사회혁신의 좋은 연결을{" "}
                <span className="text-primary">실행 가능한 사업</span>으로
              </h1>
              <p className="mx-auto max-w-xl text-base leading-7 text-guud-text-muted-2 lg:mx-0">
                기업가·전문가가 온보딩 한 번으로 이어지고, 관계(추천)·기회(격차
                리포트)·사업(딜룸)의 흐름을 한곳에서 만들어갑니다.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg">
                <Link href="/signup">
                  회원가입하고 시작하기
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">이미 회원이라면 로그인</Link>
              </Button>
            </div>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-guud-hairline bg-card p-2">
            <Image
              src="/images/home-network-hero.webp"
              width={1536}
              height={1024}
              sizes="(max-width: 1023px) 100vw, 58vw"
              preload
              alt="세 개의 연결된 공간에서 사람들이 아이디어를 나누고 공동 프로젝트를 만드는 모습의 일러스트"
              className="h-auto w-full rounded-[calc(var(--radius)*1.6)]"
            />
          </figure>
        </div>
      </section>

      <section id="service" className="border-y border-guud-hairline bg-card">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="max-w-2xl space-y-4">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ ONE CONNECTED FLOW ]
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              소개에서 끝나지 않는{" "}
              <span className="text-primary">사회혁신 네트워크</span>
            </h2>
            <p className="text-sm leading-7 text-guud-text-muted-2">
              사람을 연결하는 데서 시작해, 필요한 기회를 발견하고 실제 협업을
              실행하는 데까지 하나의 흐름으로 이어집니다.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {SERVICE_LAYERS.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.eyebrow}
                  className="flex min-h-72 flex-col justify-between rounded-2xl border border-guud-hairline bg-background p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-guud-text-faint">
                      0{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-[0.625rem] tracking-[0.14em] text-primary uppercase">
                      [ {item.eyebrow} ]
                    </p>
                    <h3 className="mt-3 font-heading text-xl font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-guud-text-muted-2">
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-muted">
        <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.7fr_1.3fr] lg:px-16 lg:py-28">
          <div className="space-y-5">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ HOW IT WORKS ]
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              가입하면 바로
              <br />
              <span className="text-primary">온보딩</span>을 시작해요
            </h2>
            <p className="max-w-md text-sm leading-7 text-guud-text-muted-2">
              긴 소개 대신 실제 협업에 필요한 정보만 단계별로 확인합니다. 완료한
              프로필은 첫 추천의 기준이 됩니다.
            </p>
          </div>

          <ol className="space-y-3">
            {ONBOARDING_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="grid gap-4 rounded-2xl border border-guud-hairline bg-card p-5 sm:grid-cols-[3rem_1fr] sm:items-start"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary font-mono text-xs font-medium text-primary">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-guud-text-muted-2">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start justify-between gap-8 rounded-3xl bg-foreground p-8 text-background sm:p-12 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-4">
            <UserRoundCheck className="size-7 text-primary" />
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              나의 경험과 필요를 연결할 준비가 되셨나요?
            </h2>
            <p className="text-sm leading-6 text-background/70">
              기업가와 전문가, 서로 다른 경험이 만날 때 더 큰 사회적 가치가
              시작됩니다.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
