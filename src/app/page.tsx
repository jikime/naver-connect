// 공개 랜딩 — 비회원에게 플랫폼 가치와 가입→온보딩→추천→협업 흐름을 설명한다.

import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  EyeOff,
  Handshake,
  HeartHandshake,
  Map as MapIcon,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/ScrollReveal";
import { Button } from "@/components/ui/button";

const SERVICE_LAYERS = [
  {
    eyebrow: "RELATION",
    title: "관계를 발견하고",
    description:
      "미션과 수요·공급 역량을 읽어, 서로에게 이유가 되는 기업가와 전문가를 연결합니다.",
    detail: "주간 추천 · 모둠 · 회원 검색",
    icon: Handshake,
  },
  {
    eyebrow: "OPPORTUNITY",
    title: "빈 연결을 기회로 바꾸고",
    description:
      "지역과 분야의 밸류체인을 조망해 아직 이어지지 않은 주체와 자원을 기회 카드로 찾습니다.",
    detail: "생태계맵 · 격차 리포트 · 지식 그래프",
    icon: Search,
  },
  {
    eyebrow: "EXECUTION",
    title: "협업을 사업으로 이어갑니다",
    description:
      "발견한 파트너와 제안을 딜룸으로 옮겨, 아이디어부터 실행과 자립까지 다음 행동을 관리합니다.",
    detail: "딜룸 · 외부 자원 · 공동 백오피스",
    icon: BriefcaseBusiness,
  },
];

const ONBOARDING_STEPS = [
  {
    title: "심사용 계정으로 로그인",
    description:
      "기업가 또는 전문가 계정으로 로그인하면 역할에 맞는 서비스로 이어집니다.",
  },
  {
    title: "5~7분 프로필 온보딩",
    description:
      "사전 정보를 확인하고, 지금 필요한 것과 나눌 수 있는 역량을 각각 3개씩 고릅니다.",
  },
  {
    title: "이유가 담긴 첫 추천 3인",
    description:
      "왜 만나야 하는지, 서로 무엇을 얻는지, 첫 대화 주제까지 담아 추천합니다.",
  },
  {
    title: "관계에서 협업으로",
    description:
      "대화와 모둠에서 발견한 기회를 딜룸·전문가 서비스·외부 자원으로 이어갑니다.",
  },
];

const FIELDS = [
  "의료·보건",
  "통합돌봄",
  "주택·주거",
  "에너지",
  "먹거리·농식품",
  "교통·이동",
  "농어촌·지역",
  "문화·예술",
];

const TRUST_PRINCIPLES = [
  {
    title: "서로에게 이익이 되는 연결",
    description:
      "한쪽의 부탁으로 끝나지 않도록, 받는 사람과 상대가 얻는 가치를 함께 확인합니다.",
    icon: HeartHandshake,
  },
  {
    title: "필요한 만큼만 공개",
    description:
      "고민과 수요는 공개 프로필에 노출하지 않고, 추천을 만드는 데 필요한 범위에서만 사용합니다.",
    icon: EyeOff,
  },
  {
    title: "사람이 검수하는 첫 연결",
    description:
      "파일럿 기간의 추천은 운영자가 접점과 양방향 이익, 정보 공개 범위를 확인한 뒤 전달합니다.",
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <section className="relative flex min-h-[calc(100svh-64px)] items-center px-5 py-12 sm:px-8 lg:py-16">
        <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-secondary/80 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-5">
              <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
                [ SOCIAL INNOVATION NETWORK · AX ]
              </p>
              <h1 className="font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                사람을 찾는 일을 넘어,
                <br className="hidden sm:block" /> 사회혁신의 좋은 연결을{" "}
                <span className="text-primary">실행 가능한 사업</span>으로
              </h1>
              <p className="mx-auto max-w-xl text-base leading-7 text-guud-text-muted-2 lg:mx-0">
                기업가와 전문가가 서로의 필요와 경험으로 이어지고,
                관계·기회·사업의 흐름을 한곳에서 만들어갑니다.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg">
                <Link href="/login">
                  심사용 계정으로 로그인
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-guud-hairline border-y border-guud-hairline py-4 text-left">
              {[
                ["5~7분", "프로필 온보딩"],
                ["3인", "첫 추천"],
                ["3단계", "관계에서 사업까지"],
              ].map(([value, label]) => (
                <div key={label} className="px-3 first:pl-0 last:pr-0 sm:px-5">
                  <dt className="font-heading text-lg font-semibold text-primary sm:text-xl">
                    {value}
                  </dt>
                  <dd className="mt-1 text-[0.6875rem] leading-4 text-guud-text-muted-2 sm:text-xs">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className="relative overflow-hidden rounded-3xl border border-guud-hairline bg-card p-2">
            <Image
              src="/images/home-network-hero.webp"
              width={1536}
              height={1024}
              sizes="(max-width: 1023px) calc(100vw - 40px), 58vw"
              preload
              alt="서로 연결된 세 공간에서 사람들이 아이디어를 나누고 공동 프로젝트를 만드는 모습"
              className="h-auto w-full rounded-[calc(var(--radius)*1.6)]"
            />
            <figcaption className="absolute right-5 bottom-5 left-5 flex items-center gap-2 rounded-2xl bg-background/85 px-4 py-3 text-xs font-medium text-foreground backdrop-blur-md sm:right-auto sm:max-w-xs">
              <Sparkles className="size-4 shrink-0 text-primary" />
              연결의 이유와 다음 행동까지 함께 제안합니다.
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        id="service"
        className="scroll-mt-20 border-y border-guud-hairline bg-card"
      >
        <div className="mx-auto w-full max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <ScrollReveal className="max-w-2xl space-y-4">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ ONE CONNECTED FLOW ]
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              소개에서 끝나지 않는{" "}
              <span className="text-primary">사회혁신 네트워크</span>
            </h2>
            <p className="text-sm leading-7 text-guud-text-muted-2">
              개인의 프로필, 지역 생태계의 빈틈, 협업 실행을 따로 보지 않고
              하나의 흐름으로 연결합니다.
            </p>
          </ScrollReveal>

          <ScrollRevealGroup
            className="mt-12 grid gap-4 md:grid-cols-3"
            itemClassName="h-full"
          >
            {SERVICE_LAYERS.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.eyebrow}
                  className="group flex h-full min-h-80 flex-col justify-between rounded-2xl border border-guud-hairline bg-background p-6 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary group-hover:bg-background">
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
                    <p className="mt-5 border-t border-guud-hairline pt-4 text-xs font-medium text-foreground">
                      {item.detail}
                    </p>
                  </div>
                </article>
              );
            })}
          </ScrollRevealGroup>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-muted">
        <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.68fr_1.32fr] lg:px-16 lg:py-28">
          <ScrollReveal className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ HOW IT WORKS ]
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              로그인하면 바로
              <br />
              <span className="text-primary">온보딩</span>을 시작해요
            </h2>
            <p className="max-w-md text-sm leading-7 text-guud-text-muted-2">
              긴 서술 대신 선택하기 쉬운 항목으로 뼈대를 만들고, 필요한 곳에만
              한 줄을 더합니다. 완료한 프로필은 첫 추천의 기준이 됩니다.
            </p>
            <div className="flex items-start gap-3 rounded-2xl border border-guud-hairline bg-background p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-xs leading-5 text-guud-text-muted-2">
                로그인 → 온보딩 → 프로필 확정 → 첫 추천까지 한 흐름으로 체험할
                수 있습니다.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <ol className="space-y-3">
              {ONBOARDING_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="grid gap-4 rounded-2xl border border-guud-hairline bg-card p-5 sm:grid-cols-[3rem_1fr] sm:items-start sm:p-6"
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
          </ScrollReveal>
        </div>
      </section>

      <section id="fields" className="scroll-mt-20 bg-background">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-6 py-20 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-16 lg:py-28">
          <ScrollReveal direction="left">
            <figure className="overflow-hidden rounded-3xl border border-guud-hairline bg-secondary p-2">
              <Image
                src="/images/social-ecosystem-network.webp"
                width={1536}
                height={1024}
                sizes="(max-width: 1023px) calc(100vw - 48px), 55vw"
                alt="돌봄, 의료, 주거, 에너지, 먹거리, 교통 등 지역의 여러 주체가 길로 연결된 생태계"
                className="aspect-[4/3] w-full rounded-[calc(var(--radius)*1.6)] object-cover lg:aspect-[3/2]"
              />
            </figure>
          </ScrollReveal>

          <ScrollReveal className="space-y-7" direction="right" delay={0.08}>
            <div className="space-y-4">
              <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
                [ EIGHT FIELDS · ONE ECOSYSTEM ]
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                서로 다른 현장을
                <br /> 하나의 <span className="text-primary">생태계</span>로
                봅니다
              </h2>
              <p className="text-sm leading-7 text-guud-text-muted-2">
                분야를 따로 나누는 대신, 주거가 돌봄의 고객을 만들고 교통이 의료
                접근을 돕는 것처럼 실제로 자원이 흐르는 연결을 찾습니다.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-2" aria-label="참여 분야">
              {FIELDS.map((field) => (
                <li
                  key={field}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-guud-hairline bg-card px-3 text-sm font-medium text-foreground"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  {field}
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 text-xs leading-5 text-guud-text-muted-2">
              <MapIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              공개 데이터와 회원의 현장 검증을 함께 반영해 지역별 빈 연결과
              기회를 갱신합니다.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section
        id="trust"
        className="scroll-mt-20 bg-foreground text-background"
      >
        <div className="mx-auto w-full max-w-[1280px] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
          <ScrollReveal className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div className="space-y-4">
              <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-background/55 uppercase">
                [ TRUST BY DESIGN ]
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                연결보다 먼저,
                <br /> 신뢰를 설계합니다
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-background/65 lg:justify-self-end">
              솔직한 수요가 좋은 추천을 만들지만, 공개 범위가 불분명하면 누구도
              솔직해질 수 없습니다. 정보와 추천, 운영의 원칙을 처음부터 분명하게
              둡니다.
            </p>
          </ScrollReveal>
          <ScrollRevealGroup
            className="mt-10 grid gap-3 md:grid-cols-3"
            itemClassName="h-full"
          >
            {TRUST_PRINCIPLES.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="h-full rounded-2xl border border-background/15 bg-background/5 p-5 sm:p-6"
                >
                  <Icon className="size-5 text-primary" />
                  <h3 className="mt-8 font-heading text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-background/65">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </ScrollRevealGroup>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <ScrollReveal className="mx-auto flex w-full max-w-[1280px] flex-col items-start justify-between gap-8 rounded-3xl bg-secondary p-8 sm:p-12 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-4">
            <UserRoundCheck className="size-7 text-primary" />
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              나의 경험과 필요를 연결할 준비가 되셨나요?
            </h2>
            <p className="text-sm leading-6 text-guud-text-muted-2">
              기업가와 전문가, 서로 다른 경험이 만날 때 더 큰 사회적 가치가
              시작됩니다.
            </p>
          </div>
          <Button asChild size="lg" className="w-full shrink-0 sm:w-auto">
            <Link href="/login">
              심사용 계정으로 로그인
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </ScrollReveal>
      </section>

      <footer className="border-t border-guud-hairline px-6 py-8 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2 text-xs text-guud-text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-foreground">
            사회혁신기업가네트워크 AX 플랫폼
          </p>
          <p>관계에서 기회로, 기회에서 함께 만드는 사업으로.</p>
        </div>
      </footer>
    </div>
  );
}
