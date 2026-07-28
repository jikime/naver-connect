// /profile — 프로필 카드 라우트. 정적 셸은 Server Component, 카드 본문은 Client(ADR-04).
// 근거: TASKS.md T-010, FR-ON-08, FR-GL-02/03

import { ArrowRight, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "프로필 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
            [ MEMBER · PROFILE ]
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            나를 설명하는 <span className="text-primary">연결의 기준</span>
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-guud-text-muted-2">
            내가 가진 경험과 지금 필요한 연결을 확인하고, 더 나은 추천을 위해
            프로필을 최신 상태로 유지해 주세요.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/onboarding">
              <PencilLine className="size-4" /> 프로필 업데이트
            </Link>
          </Button>
          <Button asChild>
            <Link href="/recommendations">
              내 추천 확인 <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>
      <ProfileCard />
    </div>
  );
}
