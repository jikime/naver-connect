"use client";

// GlobalNav — 전역 내비게이션. 온보딩→프로필→생태계맵→주간추천 순서를 강제한다(FR-GL-04).
// 근거: ARCHITECTURE.md §3(L3 GlobalNav), TASKS.md T-007
// 격차 리포트·딜룸·백오피스·운영자 검수/KPI는 순서 강제 대상이 아닌 보조 진입점(2차 그룹).
//
// 모드 B 회송: 기존 flex-wrap만으로는 390px에서 헤더가 여러 줄로 늘어졌다(DESIGN.md
// Responsive Behavior는 767/768px 단일 브레이크포인트 하드 전환을 규정). md(768px) 미만은
// 햄버거+Sheet로 전체 항목을 접고, md 이상은 기존 가로 내비를 그대로 유지한다.

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useViewerContextStore } from "@/stores/viewer-context";

const PRIMARY_NAV = [
  { href: "/onboarding", label: "온보딩" },
  { href: "/profile", label: "프로필" },
  { href: "/ecosystem", label: "생태계맵" },
  { href: "/recommendations", label: "주간추천" },
] as const;

const SECONDARY_NAV = [
  { href: "/gap-report", label: "사업기회 발굴" },
  { href: "/collab-cases", label: "협업사례" },
  { href: "/proposals", label: "제안 트래킹" },
  { href: "/knowledge-graph", label: "지식 그래프" },
  { href: "/deal-rooms", label: "딜룸" },
  { href: "/deal-sourcing", label: "딜소싱" },
  { href: "/resources", label: "자원검색" },
  { href: "/finance", label: "금융 서비스" },
  { href: "/backoffice", label: "백오피스" },
  { href: "/search", label: "회원 검색" },
  { href: "/meetups", label: "모듬" },
] as const;

const OPERATOR_NAV = [
  { href: "/operator/review", label: "검수" },
  { href: "/operator/kpi", label: "KPI" },
  { href: "/admin/rules", label: "추천 룰" },
] as const;

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center px-2 py-1 text-sm",
        active
          ? "text-foreground font-semibold border-b-2 border-foreground"
          : // 2026-07-19 하나 크로스워크로 값 갱신: guud-text-muted-2(#666666)는
            // guud-header-band(#F2FAF8, hana badge-tint)에서 5.42:1로 AA 통과지만,
            // guud-text-strong(#333333, 11.92:1)이 더 여유 있어 기존 보정을 유지.
            "text-guud-text-strong hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

/** 모바일 Sheet 안에서 쓰는 내비 링크 — 클릭 시 SheetClose로 자동 닫힘, 세로 목록형. */
function MobileNavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <SheetClose asChild>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center border-b border-guud-hairline px-2 text-sm",
          active
            ? "font-semibold text-foreground"
            : "text-guud-text-strong hover:text-foreground",
        )}
      >
        {label}
      </Link>
    </SheetClose>
  );
}

export function GlobalNav() {
  const pathname = usePathname();
  const role = useViewerContextStore((state) => state.role);
  const mobileItems = [
    ...PRIMARY_NAV,
    ...SECONDARY_NAV,
    ...(role === "운영자" ? OPERATOR_NAV : []),
  ];

  return (
    <nav
      aria-label="전역 내비게이션"
      className="border-t border-guud-hairline px-[30px] py-2"
    >
      {/* 데스크톱(≥768px): 기존 가로 내비 그대로 */}
      <div className="hidden md:flex md:flex-wrap md:items-center md:gap-x-5 md:gap-y-1">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}
        <span className="mx-1 h-4 w-px bg-guud-hairline" aria-hidden="true" />
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}
        {role === "운영자" && (
          <>
            <span
              className="mx-1 h-4 w-px bg-guud-hairline"
              aria-hidden="true"
            />
            {OPERATOR_NAV.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} />
            ))}
          </>
        )}
      </div>

      {/* 모바일(<768px): 햄버거 + Sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="min-h-11 gap-1.5">
              <Menu className="size-4" aria-hidden />
              메뉴
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>전역 내비게이션</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col px-4 pb-4">
              {mobileItems.map((item) => (
                <MobileNavLink key={item.href} {...item} pathname={pathname} />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
