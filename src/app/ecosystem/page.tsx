// /ecosystem — 생태계맵 v2. 정적 셸은 Server Component, 본문(드릴다운·내 소속단체)은 Client(ADR-04).
// 근거: PRD §8.15, ARCHITECTURE.md §3, FR-EM2-01~04, TASKS #28
// v1.1: 구 FR-EM-01~03 "이웃회원·주변조직" 카드 리스트를 밸류체인→5-force→단체→지역
// 드릴다운으로 전면 개편(§8.11 대체). 온보딩 직후 진입점 역할은 유지한다(FR-GL-04).

import { Building2, Network, Route, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { EcosystemMapV2 } from "@/components/ecosystem/EcosystemMapV2";
import { getEcosystemMap } from "@/lib/dal";

export const metadata: Metadata = {
  title: "생태계맵 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

// getEcosystemMap 응답(밸류체인·5-force·단체)은 역할·페르소나에 무관한 비민감 공개
// 집계라, gap-report/page.tsx와 동일하게 placeholder ViewerContext로 서버에서 미리
// 가져온다(ADR-04). "내 소속/대상 단체"(FR-EM2-03)만 실제 뷰어 컨텍스트가 필요해
// MyOrgsPanel(Client)에서 별도로 조회한다.
const PLACEHOLDER_VIEWER = { role: "기업가", personaId: "M-001" } as const;

export default async function EcosystemPage() {
  const { stages, forces, orgs, stageLinks } =
    await getEcosystemMap(PLACEHOLDER_VIEWER);
  const fieldCount = new Set(stages.map((stage) => stage.field_id)).size;
  const regionCount = new Set(orgs.map((org) => org.region.sido)).size;
  const verifiedOrgCount = orgs.filter(
    (org) => org.verified_by.length > 0,
  ).length;

  return (
    <div className="flex-1 bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto w-full max-w-7xl space-y-10 sm:space-y-14">
        <section className="overflow-hidden rounded-[2rem] bg-foreground text-background shadow-sm">
          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            <div className="flex flex-col justify-between gap-10 p-7 sm:p-10 lg:p-12">
              <div>
                <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-primary uppercase">
                  [ STAGE 02 · ECOSYSTEM MAP ]
                </p>
                <h1 className="mt-4 max-w-xl font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  단체 목록을 넘어,
                  <br />
                  연결의 구조를 봅니다
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-background/65 sm:text-base">
                  분야의 밸류체인과 이해관계자, 지역 단체를 한 흐름으로
                  살펴보세요. 이미 작동하는 연결과 아직 비어 있는 연결이 다음
                  협업의 출발점이 됩니다.
                </p>
              </div>

              <ul className="grid gap-3 text-sm text-background/80 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <li className="flex items-center gap-2">
                  <Network className="size-4 shrink-0 text-primary" />
                  단계별 관계
                </li>
                <li className="flex items-center gap-2">
                  <Route className="size-4 shrink-0 text-primary" />
                  실제·잠재 흐름
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-primary" />
                  출처·검증 정보
                </li>
              </ul>
            </div>

            <figure className="relative min-h-80 overflow-hidden bg-[#f1ece2] sm:min-h-[28rem] lg:min-h-full">
              <Image
                src="/images/ecosystem-map-cover.webp"
                alt="의료, 돌봄, 주거, 이동, 에너지 조직이 자원 경로로 연결된 지역 생태계 조감도"
                fill
                sizes="(max-width: 1023px) 100vw, 56vw"
                className="object-cover"
                preload
              />
            </figure>
          </div>
        </section>

        <section
          aria-label="생태계맵 데이터 요약"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { icon: Network, label: "핵심 분야", value: `${fieldCount}개` },
            {
              icon: Route,
              label: "단계 간 자원 흐름",
              value: `${stageLinks.length}개`,
            },
            {
              icon: Building2,
              label: "탐색 가능한 단체",
              value: `${orgs.length}곳`,
            },
            {
              icon: ShieldCheck,
              label: "회원 검증 단체",
              value: `${verifiedOrgCount}곳 · ${regionCount}개 시도`,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-2xl border border-guud-hairline bg-card p-5"
              >
                <Icon className="size-4 text-primary" />
                <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-guud-text-muted-2">
                  {item.label}
                </p>
              </article>
            );
          })}
        </section>

        <section>
          <header className="mb-7 max-w-3xl">
            <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
              [ EXPLORE THE SYSTEM ]
            </p>
            <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              분야에서 단체까지, 맥락을 놓치지 않고 탐색하세요
            </h2>
            <p className="mt-3 text-sm leading-6 text-guud-text-muted-2">
              분야와 단계를 고르면 연결된 자원 흐름과 5-force 이해관계자가 함께
              바뀝니다. 단체 데이터의 출처와 최신 확인일도 바로 비교할 수
              있어요.
            </p>
          </header>
          <EcosystemMapV2
            stages={stages}
            forces={forces}
            orgs={orgs}
            stageLinks={stageLinks}
          />
        </section>
      </div>
    </div>
  );
}
