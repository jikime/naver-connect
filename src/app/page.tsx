// 홈 랜딩 — 온보딩/프로필로 유도(T-007). 데이터 없이 정적 셸이라 Server Component로 둔다(ADR-04).
// 근거: TASKS.md T-007, FR-GL-04(전역 네비 진입 순서: 온보딩→프로필→생태계맵→주간추천)

import Image from "next/image";
import Link from "next/link";
import { AutomationLevelBadge } from "@/components/shell/AutomationLevelBadge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="flex flex-1 items-center px-5 py-12 sm:px-8 lg:py-16">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-5">
            {/* modoomat eyebrow(mono·대문자·대괄호) + 헤드라인 primary 1점 강조 */}
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ SOCIAL VENTURE NETWORK · AX ]
            </p>
            <h1 className="font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
              사회혁신기업가네트워크 <span className="text-primary">AX</span>{" "}
              플랫폼
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-guud-text-muted-2 lg:mx-0">
              기업가·전문가가 온보딩 한 번으로 이어지고, 관계(추천)·기회(격차
              리포트)·사업(딜룸) 3층이 서로 연결되는 모습을 미리 봅니다. 상단
              역할 스위처로 8인 페르소나를 전환해보세요.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg">
              <Link href="/onboarding">
                온보딩 시작하기 <AutomationLevelBadge frId="FR-ON-01" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/profile">내 프로필 보기</Link>
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
  );
}
