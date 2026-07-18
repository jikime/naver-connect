// /profile — 프로필 카드 라우트. 정적 셸은 Server Component, 카드 본문은 Client(ADR-04).
// 근거: TASKS.md T-010, FR-ON-08, FR-GL-02/03

import type { Metadata } from "next";
import { ProfileCard } from "@/components/profile/ProfileCard";

export const metadata: Metadata = {
  title: "프로필 | 사회혁신기업가네트워크 AX 플랫폼 (목업)",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-[30px] py-10">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">
        프로필
      </h1>
      <ProfileCard />
    </div>
  );
}
