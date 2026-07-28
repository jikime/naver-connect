"use client";

// ProfileCard — 공개/비공개층을 시각적으로 구분해 보여주는 프로필 카드(FR-ON-08, FR-GL-02/03).
// 로그인 세션이 동기화한 ViewerContext의 personaId로 본인 프로필만 조회한다. 공개층은 다른
// 회원에게 보이는 역량·활동 정보를, 비공개층은 추천에만 쓰는 수요·프로젝트·이력을 담는다.
// 이미 마스킹된 DTO만 받으며 비공개 필드의 2차 방어는 VisibilityGate가 담당한다(ADR-03).

import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  Handshake,
  History,
  Lock,
  MapPin,
  Network,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { VisibilityGate } from "@/components/shared/VisibilityGate";
import { Badge } from "@/components/ui/badge";
import fieldsSeed from "@/data/fields.json";
import tagsSeed from "@/data/tags.json";
import { getMember } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { Field, MaskedMember, Tag } from "@/types";

const fields = fieldsSeed as Field[];
const tags = tagsSeed as Tag[];

function fieldName(id: number): string {
  return fields.find((field) => field.id === id)?.name ?? `#${id}`;
}

function tagName(id: number): string {
  return tags.find((tag) => tag.id === id)?.name ?? `태그 #${id}`;
}

function ProfileLoading() {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-guud-hairline bg-card"
      aria-live="polite"
    >
      <span className="sr-only">프로필을 불러오는 중입니다.</span>
      <div className="grid animate-pulse lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5 p-6 sm:p-9">
          <div className="h-6 w-28 rounded-full bg-muted" />
          <div className="h-10 w-48 rounded-xl bg-muted" />
          <div className="h-5 w-72 max-w-full rounded-lg bg-muted" />
          <div className="h-24 rounded-2xl bg-muted" />
        </div>
        <div className="min-h-72 bg-secondary lg:min-h-96" />
      </div>
    </div>
  );
}

export function ProfileCard() {
  const vc = useViewerContext();
  const sectionId = useId();

  const [member, setMember] = useState<MaskedMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: vc 객체는 selector가 매 렌더 새로 만들어 원시값(personaId/role)만 추적한다
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMember(vc, vc.personaId)
      .then((nextMember) => {
        if (!cancelled) setMember(nextMember);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "프로필을 찾을 수 없어요.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vc.personaId, vc.role]);

  if (loading) return <ProfileLoading />;

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="font-medium text-foreground">
          프로필을 불러오지 못했어요.
        </p>
        <p className="mt-1 text-sm text-guud-text-muted-2">{error}</p>
      </div>
    );
  }

  if (!member) return null;

  return (
    <article className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-guud-hairline bg-card">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="flex flex-col justify-between gap-8 p-6 sm:p-9 lg:p-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-secondary px-3 py-1 font-semibold tracking-normal text-secondary-foreground normal-case">
                  {member.member_type}
                </Badge>
                {member.expert_subtype && (
                  <Badge className="rounded-full border border-guud-hairline bg-background px-3 py-1 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
                    {member.expert_subtype}
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-guud-text-muted-2">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  온보딩 완료
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-foreground font-heading text-xl font-semibold text-background sm:size-16 sm:text-2xl"
                  aria-hidden="true"
                >
                  {member.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {member.name}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-guud-text-muted-2">
                    {member.org.name} · {member.org.role}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.field_tags.map((id) => (
                      <Badge
                        key={id}
                        className="rounded-full border border-guud-hairline bg-background px-2.5 py-1 font-semibold tracking-normal text-guud-text-muted-2 normal-case"
                      >
                        {fieldName(id)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <blockquote className="relative rounded-2xl bg-muted p-5 pl-12 sm:p-6 sm:pl-14">
                <Quote className="absolute top-5 left-5 size-5 text-primary sm:top-6 sm:left-6" />
                <p className="font-heading text-lg leading-8 font-medium text-foreground sm:text-xl">
                  {member.mission_statement}
                </p>
                <footer className="mt-3 font-mono text-[0.625rem] tracking-[0.14em] text-guud-text-muted-2 uppercase">
                  [ MY MISSION ]
                </footer>
              </blockquote>
            </div>

            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-guud-hairline p-4">
                <dt className="flex items-center gap-2 text-xs text-guud-text-muted-2">
                  <MapPin className="size-4 text-primary" /> 활동 지역
                </dt>
                <dd className="mt-2 text-sm font-semibold text-foreground">
                  {member.region.sido} {member.region.sigungu}
                </dd>
              </div>
              <div className="rounded-2xl border border-guud-hairline p-4">
                <dt className="flex items-center gap-2 text-xs text-guud-text-muted-2">
                  <Building2 className="size-4 text-primary" /> 조직 유형
                </dt>
                <dd className="mt-2 text-sm font-semibold text-foreground">
                  {member.org.type}
                </dd>
              </div>
              <div className="rounded-2xl border border-guud-hairline p-4">
                <dt className="flex items-center gap-2 text-xs text-guud-text-muted-2">
                  <Network className="size-4 text-primary" /> 밸류체인
                </dt>
                <dd className="mt-2 text-sm font-semibold text-foreground">
                  {member.value_chain_stage}
                </dd>
              </div>
            </dl>
          </div>

          <figure className="relative min-h-72 overflow-hidden bg-secondary sm:min-h-96 lg:min-h-full">
            <Image
              src="/images/profile-network-cover.webp"
              alt="한 회원을 중심으로 조직, 활동 지역, 역량과 신뢰 관계가 연결되는 모습"
              fill
              sizes="(max-width: 1023px) 100vw, 46vw"
              className="object-cover"
              preload
            />
            <figcaption className="absolute right-5 bottom-5 left-5 rounded-2xl bg-background/85 px-4 py-3 text-xs font-medium text-foreground backdrop-blur-md">
              나의 미션과 경험이 새로운 연결의 출발점이 됩니다.
            </figcaption>
          </figure>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        <section
          aria-labelledby={`${sectionId}-public`}
          className="rounded-3xl border border-guud-hairline bg-card p-6 sm:p-8"
        >
          <header className="flex flex-col gap-4 border-b border-guud-hairline pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[0.625rem] font-medium tracking-[0.14em] text-primary uppercase">
                [ PUBLIC PROFILE ]
              </p>
              <h3
                id={`${sectionId}-public`}
                className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground"
              >
                내가 건넬 수 있는 경험
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-guud-text-muted-2">
                다른 회원이 나를 찾아야 할 이유와 함께할 수 있는 접점입니다.
              </p>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground">
              <Eye className="size-3.5" /> 전체 회원 공개
            </span>
          </header>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {member.visibility.public.supply_tags.map((supply, index) => (
              <article
                key={supply.tagId}
                className="flex min-h-36 flex-col justify-between rounded-2xl bg-muted p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge className="rounded-full bg-background px-2.5 py-1 font-semibold tracking-normal text-foreground normal-case">
                    {tagName(supply.tagId)}
                  </Badge>
                  <span className="font-mono text-xs text-guud-text-faint">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-6 text-sm leading-6 font-medium text-foreground">
                  {supply.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <section className="rounded-3xl border border-guud-hairline bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                <Handshake className="size-5" />
              </span>
              <div>
                <p className="font-mono text-[0.625rem] tracking-[0.14em] text-guud-text-muted-2 uppercase">
                  [ COLLABORATION ]
                </p>
                <h3 className="mt-1 font-heading text-lg font-semibold text-foreground">
                  함께하는 방식
                </h3>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {member.visibility.public.activities.map((activity) => (
                <Badge
                  key={activity}
                  className="rounded-full border border-guud-hairline bg-background px-3 py-1.5 font-semibold tracking-normal text-foreground normal-case"
                >
                  {activity}
                </Badge>
              ))}
            </div>
            <p className="mt-5 border-t border-guud-hairline pt-4 text-sm leading-6 text-guud-text-muted-2">
              <span className="font-semibold text-foreground">선호 방식</span>
              <br />
              {member.visibility.public.preferred_mode}
            </p>
          </section>

          <section className="rounded-3xl border border-guud-hairline bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-mono text-[0.625rem] tracking-[0.14em] text-guud-text-muted-2 uppercase">
                  [ TRUST POINT ]
                </p>
                <h3 className="mt-1 font-heading text-lg font-semibold text-foreground">
                  신뢰 연결점
                </h3>
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              {member.trust_connections.map((connection) => (
                <li
                  key={`${connection.type}-${connection.ref}`}
                  className="rounded-2xl bg-muted p-4"
                >
                  <p className="text-xs font-semibold text-primary">
                    {connection.type}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-foreground">
                    {connection.ref}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section
        aria-labelledby={`${sectionId}-private`}
        className="overflow-hidden rounded-3xl bg-foreground text-background"
      >
        <header className="flex flex-col gap-5 border-b border-background/15 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background/10 text-primary">
              <Lock className="size-5" />
            </span>
            <div>
              <p className="font-mono text-[0.625rem] font-medium tracking-[0.14em] text-background/55 uppercase">
                [ PRIVATE MATCHING LAYER ]
              </p>
              <h3
                id={`${sectionId}-private`}
                className="mt-2 font-heading text-2xl font-semibold tracking-tight"
              >
                지금 필요한 연결
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-background/65">
                고민과 수요는 공개 프로필에 나타나지 않고, 더 정확한 추천을
                만드는 데만 사용됩니다.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-background/20 px-3 py-2 text-xs font-semibold text-background/80">
            <ShieldCheck className="size-3.5 text-primary" /> 나와 운영자만 확인
          </span>
        </header>

        <div className="p-6 sm:p-8">
          <VisibilityGate
            value={member.visibility.private}
            fallbackLabel="비공개 — 본인 또는 운영자만 볼 수 있어요"
          >
            {(privateLayer) => (
              <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
                <div className="space-y-3">
                  {privateLayer.demand_tags.map((demand) => (
                    <article
                      key={demand.tagId}
                      className="rounded-2xl border border-background/15 bg-background/5 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full bg-background/10 px-2.5 py-1 font-semibold tracking-normal text-background normal-case">
                          {tagName(demand.tagId)}
                        </Badge>
                        {demand.priority && (
                          <Badge className="rounded-full bg-primary px-2.5 py-1 font-semibold tracking-normal text-primary-foreground normal-case">
                            <Star className="size-3 fill-current" /> 가장 급한
                            수요
                          </Badge>
                        )}
                      </div>
                      <blockquote className="mt-4 flex gap-3 text-sm leading-6 text-background/85">
                        <Quote className="mt-0.5 size-4 shrink-0 text-primary" />
                        <p>“{demand.detail_quote}”</p>
                      </blockquote>
                    </article>
                  ))}
                </div>

                <div className="space-y-3">
                  {privateLayer.hot_lead?.flag && (
                    <section className="rounded-2xl border border-primary/60 bg-primary/10 p-5">
                      <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <Sparkles className="size-4" /> 구체적 협업 프로젝트
                      </p>
                      <p className="mt-3 text-sm leading-6 font-semibold text-background">
                        {privateLayer.hot_lead.project_summary}
                      </p>
                      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        <div>
                          <dt className="text-background/50">현재 단계</dt>
                          <dd className="mt-1 font-medium text-background/85">
                            {privateLayer.hot_lead.stage}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-background/50">필요한 파트너</dt>
                          <dd className="mt-1 font-medium text-background/85">
                            {privateLayer.hot_lead.needed_partner}
                          </dd>
                        </div>
                      </dl>
                    </section>
                  )}

                  <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="rounded-2xl border border-background/15 bg-background/5 p-5">
                      <dt className="flex items-center gap-2 text-xs text-background/55">
                        <Clock3 className="size-4 text-primary" /> 낼 수 있는
                        시간
                      </dt>
                      <dd className="mt-3 text-sm font-semibold text-background">
                        {privateLayer.availability}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-background/15 bg-background/5 p-5">
                      <dt className="flex items-center gap-2 text-xs text-background/55">
                        <History className="size-4 text-primary" /> 추천 이력
                      </dt>
                      <dd className="mt-3 text-sm font-semibold text-background">
                        {privateLayer.recommendation_history.length}건
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-start gap-3 rounded-2xl border border-background/15 p-4 text-xs leading-5 text-background/60">
                    <BriefcaseBusiness className="mt-0.5 size-4 shrink-0 text-primary" />
                    추천 메시지에는 연결에 필요한 최소 정보만 선택적으로
                    전달됩니다.
                  </div>
                </div>
              </div>
            )}
          </VisibilityGate>
        </div>
      </section>
    </article>
  );
}
