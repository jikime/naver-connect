import type { Metadata } from "next";
import { Geist_Mono, Hind, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { GlobalNav } from "@/components/shell/GlobalNav";
import { MotionProvider } from "@/components/shell/MotionProvider";
import { PhaseBanner } from "@/components/shell/PhaseBanner";
import {
  type PersonaRosterEntry,
  RoleSwitcher,
} from "@/components/shell/RoleSwitcher";
import { getMembers } from "@/lib/dal";
import { cn } from "@/lib/utils";

// 한글 본문 폰트(--font-sans) ← guud DESIGN.md typography.family "NotoSansCJKkr" 대응.
// 가변 폰트라 weight 미지정 시 100~900 전 구간 사용 가능(body 400 / subhead·chip·button 600 / headline·title 700 / label-strong 800).
const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// 라틴/숫자/디스플레이 폰트(--font-heading) ← guud DESIGN.md typography.family "GillSansWGL" 대체.
// GillSansWGL 웹폰트 실체 미확인(Known Gaps) → DESIGN.md의 오픈소스 대체 규정("Hind·Mukta 또는 시스템 humanist sans")에 따라 Hind 채택.
// display-xl/display-lg(700) · price(700) · eyebrow(600) 타이포에 사용.
const gillSansSubstitute = Hind({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "사회혁신기업가네트워크 AX 플랫폼 (목업)",
  description:
    "미래 자동화 버전 UI 프리뷰 — 관계·기회·사업 3층 소셜벤처 네트워크 목업",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // RSC 셸은 민감 시드를 직접 import하지 않는다(ADR-03/04) — getMembers(DAL) 경유로만
  // 이름/유형 등 공개 필드를 읽어 RoleSwitcher(Client)에 최소 props로 내려준다.
  const members = await getMembers({ role: "기업가", personaId: "M-001" });
  const personas: PersonaRosterEntry[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    member_type: m.member_type,
  }));

  return (
    <html
      lang="ko"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        notoSansKR.variable,
        gillSansSubstitute.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <MotionProvider>
          <header className="bg-guud-header-band">
            <div className="flex items-center justify-between px-[30px] py-3">
              <span className="font-heading text-lg font-bold text-foreground">
                AX 플랫폼
              </span>
              <RoleSwitcher personas={personas} />
            </div>
            <GlobalNav />
          </header>
          <PhaseBanner />
          <main className="flex flex-1 flex-col">{children}</main>
        </MotionProvider>
      </body>
    </html>
  );
}
