"use client";

// GlobalNav — modoomat 전환(2026-07-27): 사용자 확정 스타일 "풀폭 글래스 바".
// - 플로팅 알약이 아니라 화면 전체 폭 상단 고정 바(sticky top-0, z-100 = {zIndex.sticky}).
// - 배경 {colors.canvas} 반투명 {opacity.glass}(0.6) + backdrop-blur, 스크롤 시 {opacity.glass-strong}
//   (0.7)로 진해짐. 바 하단 {colors.hairline} 1px.
// - 비로그인: 랜딩 앵커 + 로그인/회원가입. 로그인: 기존 전체 대메뉴 + 프로필 메뉴.
// - 모바일: 로고 + 햄버거 → Sheet 풀스크린 {colors.menu-overlay} #e8e1d9 오버레이(z-200 = {zIndex.overlay}).
//
// 대메뉴 상호작용(v4 계승): 라벨 우측 아래 화살표(열림 시 위로 회전), hover/포커스/클릭으로
// 박스형 패널 열림, 영역 이탈 150ms 유예 닫힘·Escape·링크 이동으로 닫힘. 패널은 각 트리거의 relative
// 컨테이너 아래에 붙고 바 하단 라인과 폴더 탭 문법으로 연결된다(barRef 실측 top 오프셋).
//
// modoomat 형태: 각짐(rounded-none) 폐기 → 패널은 rounded-b-xl, 라인은 {colors.hairline}
// (이전 하드코드 #D2D2D2 제거, G4). 층 구분 색점(nav-groups 로컬 팔레트)은 폐기하고 mono eyebrow
// 라벨로 대체(모바일 아코디언).

import { ChevronDown, Menu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { UserMenu } from "@/components/auth/UserMenu";
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
import { useAuthSessionStore } from "@/stores/auth-session";
import {
  groupHasActiveItem,
  isItemActive,
  NAV_GROUPS,
  type NavGroup,
  OPERATOR_NAV_GROUP,
} from "./nav-groups";

/** 층 구분 mono eyebrow 라벨 — modoomat {typography.eyebrow}(대문자·양수 자간·대괄호). 색점 대체. */
function GroupEyebrow({ text }: { text: string }) {
  return (
    <span className="font-mono text-[0.625rem] font-medium tracking-[0.14em] text-guud-text-muted-2 uppercase">
      [ {text} ]
    </span>
  );
}

/** 박스형 패널 내부 — 활성 그룹의 항목을 한 줄 가로로(overflow 없이 nowrap), 14px 회색→hover 시 primary. */
function PanelRow({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-nowrap items-center gap-x-6 px-4 py-1.5">
      {group.items.map((item) => {
        const active = isItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-9 items-center whitespace-nowrap text-sm",
              active
                ? "font-semibold text-primary"
                : "text-guud-text-muted-2 hover:text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * 대메뉴(GNB) 트리거 + 그 아래 박스형 패널 — 트리거 각각을 자기만의 relative 컨테이너로
 * 감싸 패널이 "이 트리거 기준"으로 정렬되게 한다(좌측 정렬 기본, 뷰포트 우측 넘치면
 * useLayoutEffect 실측으로 우측 정렬 뒤집기). hover/포커스/클릭 전부로 열리고, 아래 화살표는
 * 열림 시 위를 향한다. 현재 페이지가 이 그룹 소속이면 항상 primary.
 * 패널 top 오프셋은 barRef(글래스 바 내부 flex 바)의 하단 - wrapper 상단을 실측해 대입한다.
 */
function GnbTriggerWithPanel({
  group,
  pathname,
  isOpen,
  onActivate,
  onClick,
  onNavigate,
  barRef,
}: {
  group: NavGroup;
  pathname: string;
  isOpen: boolean;
  onActivate: () => void;
  onClick: () => void;
  onNavigate: () => void;
  barRef: RefObject<HTMLDivElement | null>;
}) {
  const active = groupHasActiveItem(group, pathname);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [align, setAlign] = useState<"left" | "right">("left");
  const [panelTop, setPanelTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setAlign("left");
      setPanelTop(null);
      return;
    }
    const panelEl = panelRef.current;
    const wrapperEl = wrapperRef.current;
    const barEl = barRef.current;
    if (!panelEl || !wrapperEl || !barEl) return;

    const panelRect = panelEl.getBoundingClientRect();
    const overflowsRight = panelRect.right > window.innerWidth - 16;
    setAlign(overflowsRight ? "right" : "left");

    const wrapperRect = wrapperEl.getBoundingClientRect();
    const barRect = barEl.getBoundingClientRect();
    setPanelTop(barRect.bottom - wrapperRect.top - 1);
  }, [isOpen, barRef]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onMouseEnter={onActivate}
        onFocus={onActivate}
        onClick={onClick}
        aria-expanded={isOpen}
        className={cn(
          "flex h-11 items-center gap-1 px-3.5 text-sm font-normal text-guud-text-muted-2 hover:text-primary",
          (active || isOpen) && "font-semibold text-primary",
        )}
      >
        {group.label}
        <ChevronDown
          className={cn(
            "size-3 shrink-0 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.12 }}
            style={{ top: panelTop ?? undefined }}
            className={cn(
              // modoomat: 라인 = {colors.hairline}(이전 하드코드 #D2D2D2 제거), 하단만 rounded-xl.
              "absolute z-50 w-max overflow-hidden rounded-b-xl border-x border-b border-guud-hairline bg-background",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            <PanelRow
              group={group}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const active = isItemActive(href, pathname);
  return (
    <SheetClose asChild>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center border-b border-guud-hairline px-2 text-sm last:border-b-0",
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

/** 모바일 층별 아코디언 섹션 — eyebrow 라벨 + 대라벨 + 카운트 + 셰브런(열림 시 회전), 현재 페이지 소속 섹션은 기본 열림. */
function AccordionSection({
  group,
  pathname,
  defaultOpen,
}: {
  group: NavGroup;
  pathname: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="overflow-hidden rounded-2xl border border-guud-hairline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-11 w-full flex-wrap items-center gap-x-2 gap-y-1 px-3.5 py-3 text-left"
      >
        <GroupEyebrow text={group.eyebrow} />
        <span className="text-sm font-semibold text-foreground">
          {group.label}
        </span>
        <span className="text-xs font-medium text-guud-text-muted-2">
          · {group.items.length}
        </span>
        <ChevronDown
          className={cn(
            "ml-auto size-4 text-guud-text-muted-2 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <motion.section
        id={contentId}
        aria-label={group.label}
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="flex flex-col px-2 pb-1">
          {group.items.map((item) => (
            <MobileNavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthSessionStore((state) => state.user);
  const hasHydrated = useAuthSessionStore((state) => state.hasHydrated);
  const signOut = useAuthSessionStore((state) => state.signOut);
  const isAuthenticated = hasHydrated && user !== null;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  // 스크롤 시 글래스 강도 전환({opacity.glass} 0.6 → {opacity.glass-strong} 0.7).
  const [scrolled, setScrolled] = useState(false);
  const groups: NavGroup[] = [
    ...NAV_GROUPS,
    ...(user?.role === "운영자" ? [OPERATOR_NAV_GROUP] : []),
  ];
  const homeHref = isAuthenticated ? "/home" : "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenKey(null), 150);
  }

  // 클릭도 activate와 동일하게 "그냥 연다"로 통일 — 마우스는 클릭 전에 항상 hover(mouseenter)를
  // 거치므로 클릭 토글-닫힘을 넣으면 hover가 연 걸 클릭이 곧바로 닫는 충돌이 생긴다. 닫힘은
  // 영역 이탈·Esc·링크 이동만 담당한다.
  function activate(key: string) {
    cancelClose();
    setOpenKey(key);
  }

  function handleSignOut() {
    signOut();
    router.replace("/");
  }

  // Escape 닫힘은 document 레벨 리스너로 — hover로 연 경우 실제 포커스는 래퍼 바깥이라
  // 래퍼 onKeyDown으론 안 잡힌다. openKey가 있을 때만 붙이고 정리한다.
  const escapeCloseEnabled = openKey !== null;
  useEffect(() => {
    if (!escapeCloseEnabled) return;
    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenKey(null);
      }
    }
    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => document.removeEventListener("keydown", handleDocumentKeyDown);
  }, [escapeCloseEnabled]);

  return (
    // 풀폭 글래스 바 — canvas 반투명 + backdrop-blur, 하단 {colors.hairline} 1px. 스크롤 시
    // glass-strong(0.7)로 진해짐. 상단 고정(sticky top-0 z-100 = {zIndex.sticky})은 부모 <header>가 담당.
    <div
      className={cn(
        "border-b border-guud-hairline backdrop-blur-md transition-colors",
        scrolled ? "bg-background/70" : "bg-background/60",
      )}
    >
      {/* 데스크톱(≥768px) — 이 래퍼는 hover/focus 이탈을 감지하는 단일 영역(바+패널 전체를
          벗어나야 닫힘 타이머가 돈다). */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: 이 div는 상호작용 대상이 아니라
          hover/focus가 바+패널 영역을 벗어났는지 감지하는 이벤트 경계일 뿐이다. */}
      <div
        className="relative hidden md:block"
        onMouseLeave={scheduleClose}
        onMouseEnter={cancelClose}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            scheduleClose();
          }
        }}
      >
        <div
          ref={barRef}
          className="mx-auto flex min-h-[64px] max-w-[1280px] items-center justify-between px-8"
        >
          <div className="flex items-center">
            <Link
              href={homeHref}
              className="flex shrink-0 items-center gap-2.5"
            >
              <Image
                src="/images/ax-brand-mark.png"
                width={32}
                height={32}
                alt=""
                className="size-7"
              />
              <span className="font-heading text-lg font-bold text-foreground">
                AX 플랫폼
              </span>
            </Link>
            {isAuthenticated ? (
              <nav aria-label="주 메뉴" className="ml-9 flex items-center">
                {groups.map((group) => (
                  <GnbTriggerWithPanel
                    key={group.key}
                    group={group}
                    pathname={pathname}
                    isOpen={openKey === group.key}
                    barRef={barRef}
                    onActivate={() => activate(group.key)}
                    onClick={() => activate(group.key)}
                    onNavigate={() => setOpenKey(null)}
                  />
                ))}
              </nav>
            ) : (
              <nav
                aria-label="랜딩 메뉴"
                className="ml-10 flex items-center gap-7"
              >
                <Link
                  href="/#service"
                  className="text-sm text-guud-text-muted-2 hover:text-primary"
                >
                  서비스 소개
                </Link>
                <Link
                  href="/#how-it-works"
                  className="text-sm text-guud-text-muted-2 hover:text-primary"
                >
                  이용 흐름
                </Link>
              </nav>
            )}
          </div>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">회원가입</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 모바일(<768px): 로고 + 햄버거 한 행 → Sheet 풀스크린 {colors.menu-overlay} 오버레이. */}
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-2 md:hidden">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <Image
            src="/images/ax-brand-mark.png"
            width={32}
            height={32}
            alt=""
            className="size-7"
          />
          <span className="font-heading text-lg font-bold text-foreground">
            AX 플랫폼
          </span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="min-h-11 gap-1.5">
              <Menu className="size-4" aria-hidden />
              메뉴
            </Button>
          </SheetTrigger>
          {/* z-200({zIndex.overlay}) 풀스크린, 배경 {colors.menu-overlay} #e8e1d9 */}
          <SheetContent
            side="left"
            className="z-[200] w-full max-w-full overflow-y-auto bg-guud-menu-overlay sm:max-w-sm"
          >
            <SheetHeader>
              <SheetTitle>
                {isAuthenticated ? "서비스 메뉴" : "AX 플랫폼"}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-4">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 rounded-2xl bg-background/70 p-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                      {user.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {user.name}
                      </p>
                      <p className="text-xs text-guud-text-muted-2">
                        {user.role} 계정
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {groups.map((group) => (
                      <AccordionSection
                        key={group.key}
                        group={group}
                        pathname={pathname}
                        defaultOpen={groupHasActiveItem(group, pathname)}
                      />
                    ))}
                  </div>
                  <SheetClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSignOut}
                    >
                      로그아웃
                    </Button>
                  </SheetClose>
                </>
              ) : (
                <>
                  <nav className="flex flex-col" aria-label="랜딩 메뉴">
                    <SheetClose asChild>
                      <Link
                        href="/#service"
                        className="border-b border-guud-hairline px-2 py-3 text-sm font-medium text-foreground"
                      >
                        서비스 소개
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/#how-it-works"
                        className="border-b border-guud-hairline px-2 py-3 text-sm font-medium text-foreground"
                      >
                        이용 흐름
                      </Link>
                    </SheetClose>
                  </nav>
                  <SheetClose asChild>
                    <Button asChild>
                      <Link href="/signup">회원가입</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="outline">
                      <Link href="/login">로그인</Link>
                    </Button>
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
