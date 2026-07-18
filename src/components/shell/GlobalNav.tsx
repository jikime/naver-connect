"use client";

// GlobalNav — 전역 네비게이션. 온보딩→프로필→생태계맵→주간추천 순서를 강제한다(FR-GL-04).
// 근거: ARCHITECTURE.md §3(L3 GlobalNav), TASKS.md T-007
// 격차 리포트·딜룸·백오피스·운영자 검수/KPI는 순서 강제 대상이 아닌 보조 진입점(2차 그룹).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useViewerContextStore } from "@/stores/viewer-context";

const PRIMARY_NAV = [
  { href: "/onboarding", label: "온보딩" },
  { href: "/profile", label: "프로필" },
  { href: "/ecosystem", label: "생태계맵" },
  { href: "/recommendations", label: "주간추천" },
] as const;

const SECONDARY_NAV = [
  { href: "/gap-report", label: "격차 리포트" },
  { href: "/deal-rooms", label: "딜룸" },
  { href: "/backoffice", label: "백오피스" },
] as const;

const OPERATOR_NAV = [
  { href: "/operator/review", label: "검수" },
  { href: "/operator/kpi", label: "KPI" },
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
        "px-2 py-1 text-sm",
        active
          ? "text-foreground font-semibold border-b-2 border-foreground"
          : "text-guud-text-muted-2 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function GlobalNav() {
  const pathname = usePathname();
  const role = useViewerContextStore((state) => state.role);

  return (
    <nav
      aria-label="전역 내비게이션"
      className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-guud-hairline px-[30px] py-2"
    >
      {PRIMARY_NAV.map((item) => (
        <NavLink key={item.href} {...item} pathname={pathname} />
      ))}
      <span className="mx-1 h-4 w-px bg-guud-hairline" aria-hidden="true" />
      {SECONDARY_NAV.map((item) => (
        <NavLink key={item.href} {...item} pathname={pathname} />
      ))}
      {role === "운영자" && (
        <>
          <span className="mx-1 h-4 w-px bg-guud-hairline" aria-hidden="true" />
          {OPERATOR_NAV.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </>
      )}
    </nav>
  );
}
