// /profile — 프로필 카드 라우트. 정적 셸은 Server Component, 카드 본문은 Client(ADR-04).
// 근거: TASKS.md T-010, FR-ON-08, FR-GL-02/03

import type { Metadata } from "next";
import { ProfileCard } from "@/components/profile/ProfileCard";

export const metadata: Metadata = {
  title: "프로필 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-20">
      {/* ④ detail 헤더: eyebrow + headline 1점 강조 */}
      <header className="mb-8 space-y-3">
        <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
          [ MEMBER · PROFILE ]
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          내 <span className="text-primary">프로필</span>
        </h1>
      </header>
      <ProfileCard />
    </div>
  );
}
