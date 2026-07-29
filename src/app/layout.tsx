import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppAccessGate } from "@/components/auth/AppAccessGate";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { GlobalNav } from "@/components/shell/GlobalNav";
import { MotionProvider } from "@/components/shell/MotionProvider";
import { cn } from "@/lib/utils";

// mono 라벨·eyebrow·숫자 폰트(--font-mono) ← modoomat DESIGN.md typography.eyebrow/micro-label
// "IBM Plex Mono". eyebrow(대괄호·양수 자간·대문자)의 시그니처 폰트라 self-host로 확정 로드한다.
// 400=eyebrow/기본, 500=micro-label. (교체 전: Geist_Mono → IBM_Plex_Mono)
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

// 한글 본문·헤딩(--font-sans / --font-heading)은 modoomat 대체 규정(General Sans·A2z 미보유 →
// 한글 Pretendard)에 따라 Pretendard를 쓴다. Pretendard는 next/font/google에 없어(확인 완료)
// next/font 문서가 안내하는 대안 중 CDN link 방식으로 로드한다(<head>의 preconnect+stylesheet).
// 실제 font-family 스택은 globals.css @theme(--font-sans/--font-heading)에 리터럴로 정의한다.

export const metadata: Metadata = {
  title: "사회혁신기업가네트워크 AX 플랫폼",
  description:
    "기업가와 전문가의 관계를 기회와 사업으로 연결하는 사회혁신 네트워크 플랫폼",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", "font-sans", ibmPlexMono.variable)}
    >
      <head>
        {/* Pretendard(한글 본문/헤딩 대체) — next/font/google 미제공이라 CDN link로 로드.
            React 19이 <head>로 호이스트한다. 스택은 globals.css @theme에서 참조. */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <MotionProvider>
            {/* modoomat 풀폭 글래스 바 — sticky는 header에 둔다(짧은 래퍼 안에 sticky를 두면
              갇혀 스크롤 이동이 안 되므로 body 기준으로 고정되도록 header를 sticky로). */}
            <header className="sticky top-0 z-[100]">
              <GlobalNav />
            </header>
            <main className="flex flex-1 flex-col">
              <AppAccessGate>{children}</AppAccessGate>
            </main>
          </MotionProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
