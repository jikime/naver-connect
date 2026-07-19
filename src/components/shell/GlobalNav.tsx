"use client";

// GlobalNav — Task #32(v2, 사용자 피드백 반영): 정식 GNB — 대메뉴 클릭 시 소메뉴 드롭다운.
// 이전 버전(평면 그룹 나열)이 "밋밋하다"는 판정을 받아 shadcn NavigationMenu 기반으로 교체했다.
// 근거: frontend2/artifacts/sites/hanabank-biz/DESIGN.md의 nav-gnb/utility-bar 컴포넌트 스펙,
// examples/home/layout.md §1-2(유틸리티바 + GNB 100px + 로고 좌·대메뉴·검색+전체메뉴 우 구조),
// reference-desktop.png(로고 바로 오른쪽에서 대메뉴가 좌측 정렬로 시작 — 하나도 바 전체 중앙정렬이
// 아니라 이 흐름이다). 사용자 추가 지시로 로고-첫 대메뉴 간격을 32~40px로 명확히 뒀다.
//
// 형태: rounded는 globals.css 크로스워크 원칙(색은 하나, 형태는 guud 유지 — 각짐 기본, pill은
// 칩 한정)을 그대로 따라 서브 밴드도 rounded-none으로 뒀다. 프로젝트 전역에서 rounded-none을
// 이미 일관 적용 중이라(Card·Select·Sheet·Dialog 전부 rounded-none) 여기서만 둥글게 하면
// 그 일관성이 깨진다 — 굽히지 않는다.
//
// 반응형: hana 원 사이트는 반응형이 없다(Known Gap). 태블릿(md~lg)도 대메뉴가 5(6)개뿐이라
// 폭이 충분해 데스크톱과 동일한 GNB를 쓴다(2열 카드 그리드 폐기). 모바일(<md)은 Task #31의
// 아코디언 Sheet를 그대로 유지 — hana도 모바일 패턴이 없어 새로 만들지 않는다.
//
// Task #32(3차, 사용자 추가 지시): 대메뉴를 우측 역할 스위처와 같은 행에 배치 — 유틸리티
// 바(RoleSwitcher 전용 띠)를 폐지하고 단일 GNB 행([로고]—[대메뉴 좌측정렬]···[역할 스위처
// +전체메뉴, 우측정렬])으로 통합했다. 행 높이는 기존 GNB min-h-72px를 그대로 쓴다. md~lg
// 구간(768~1023px)은 폭이 로고+대메뉴 6개+역할 스위처(버튼 3+셀렉트)+전체메뉴를 모두 담기
// 빠듯해, RoleSwitcher의 역할 버튼 3개(fieldset)만 lg(1024px) 미만에서 숨기고 페르소나
// 셀렉트만 남기는 축약을 재량으로 적용했다(모바일 Sheet 호출부는 축약 없이 항상 전체 노출).
//
// Task #37(GNB v3, 폐기됨): 클릭 전용 통합 메가 패널(좌측 대메뉴 레일+우측 하위메뉴 컬럼)로
// 한 차례 교체했었으나, 사용자가 새 레퍼런스(한국 인쇄몰 스타일 GNB)를 제시하며 v3 자체를
// 취소하고 v4로 다시 교체했다 — 아래 Task #38 참고. v3의 Radix Dialog 기반 좌측 레일
// 컴포넌트(MegaPanel·MegaRail·MegaSubmenuColumn)는 코드에서 전부 제거했다.
//
// Task #38(GNB v4, 사용자 최신 지시 — 한국 인쇄몰 스타일 레퍼런스, v3 취소 후 교체):
// - 대메뉴는 가로 나열 + 각 라벨 오른쪽에 작은 "+"(하위메뉴 있음 힌트, 밴드 열림 시 45도
//   회전해 "×"처럼 보이게 — 재량으로 회전 선택, "−" 텍스트 전환 대신). GNB 바 하단에
//   전폭 hairline 라인(border-b, 이전 세대들의 border-t에서 전환).
// - **hover 시** 대메뉴 아래 GNB 바로 밑에 서브 패널이 펼쳐진다(해당 그룹 항목을 한 줄
//   가로 나열, 14px, hover 시 primary로 진해짐). Motion의 height 애니메이션으로 120ms
//   부드럽게 열린다(모바일 아코디언과 같은 패턴). ※ 이 문단이 원래 적었던 "전폭 서브
//   밴드(position:absolute·top-full, 공유 래퍼 하나, openKey만 바뀌고 언마운트 없음)"는
//   그 다음 "스타일 조정 2차"(아래)에서 박스형 패널로 구조 자체가 바뀌며 더 이상 사실이
//   아니다 — 지금은 트리거별 relative 컨테이너+AnimatePresence로 그룹이 바뀌면 실제로
//   마운트/언마운트된다. 이 문단은 v4의 상호작용 규칙(hover/포커스/클릭 열림, 150ms 유예
//   닫힘 등)은 여전히 유효해 남겨뒀다.
// - 닫힘: 포인터가 바+밴드를 포함한 바깥쪽 래퍼 전체를 벗어나면 약 150ms 유예 후 닫힘
//   (대각선 이동 허용 — setTimeout 기반, 래퍼 재진입 시 타이머 취소). 클릭도 hover와 동일하게
//   "그냥 연다"(재클릭 토글-닫힘은 넣지 않았다 — 실제 마우스는 클릭 전 항상 먼저 hover를
//   거치므로 토글을 넣으면 hover가 이미 열어둔 걸 클릭이 곧바로 다시 닫아버리는 충돌이
//   생긴다, 아래 activate 함수 주석 참고). 키보드 포커스가 트리거에 오면 즉시 열리고,
//   포커스가 래퍼 바깥으로 나가면(relatedTarget이 래퍼 밖) 같은 유예로 닫힌다. Escape로도 닫힘.
// - v3에 있던 별도 "전체메뉴" 버튼·Radix Dialog(모달/스크림)는 이 패턴엔 필요 없어 계속
//   없앤 상태로 둔다(단순 hover 플라이아웃이라 배경 inert 처리나 z-index 전쟁 자체가
//   발생하지 않는다 — v3에서 실측했던 "패널 열린 채 다른 트리거를 못 누르는" 버그 클래스가
//   구조적으로 재발할 수 없다).
// - 층 색상 점(#31 로컬 팔레트)은 이 레퍼런스의 미니멀한 밴드엔 넣지 않는다(모바일 아코디언
//   에만 유지 — 거긴 이미 검증된 별도 컴포넌트라 안 건드림).
//
// Task #38(스타일 조정 1차): 서브 밴드의 그림자(e2 raised)를 제거하고 상·하단 hairline
// 라인만으로 구분하도록 바꿨다 — 완전히 플랫하게(부상감 없이). BAND_SHADOW 상수 제거.
//
// Task #38(스타일 조정 2차, 새 레퍼런스 — 좌우 라인이 보이는 박스형 패널): "전폭 밴드"를
// 폐기하고 **콘텐츠 폭에 맞는 박스형 패널**로 바꿨다. 구조가 완전히 달라져 이전 "래퍼
// 하나가 담은 공유 밴드" 방식(inset-x-0 top-full)을 버리고, 트리거 각각을 자기만의
// relative 컨테이너로 감싸 그 아래에 패널을 붙였다(GnbTriggerWithPanel) — 그래야 패널이
// "hover한 대메뉴 아래" 그 트리거 왼쪽 기준으로 자연스럽게 정렬된다. 뷰포트 우측 넘침은
// useLayoutEffect로 패널이 커밋된 직후 getBoundingClientRect()를 측정해 우측 정렬로
// 뒤집는다(paint 전에 끝나 깜빡임 없음) — v3 때 하드코딩 정렬이 화면 밖으로 잘린 실측
// 버그를 겪어봤기 때문에(그때는 트리거 우측 기준 고정, 지금은 실측 기반 자동 보정).
//
// Task #38(스타일 조정 3차, 바 라인 ↔ 패널 라인 연결 — 폴더 탭 문법): 패널이 열리면 GNB
// 바 하단 라인과 패널 테두리가 하나로 이어져 보여야 한다는 지시 — 패널에 top border를
// 아예 안 주고(border-x + border-b만), top을 `calc(100% - 1px)`로 살짝 끌어올려 바의
// 하단 라인 위에 1px 겹치게 앉혔다. 패널 배경(bg-background, 불투명)이 그 겹친 구간의
// 바 라인을 덮어 "끊어 보이게" 하고, 패널의 좌우+하단 라인이 그 끊긴 자리에서 이어져
// 마치 하나의 윤곽선(탭+패널)처럼 보인다 — z-index를 올리거나 실제로 바 라인에 구멍을
// 내는 게 아니라 순전히 겹침+불투명 배경으로 만든 시각 효과다.

import { ChevronDown, Menu, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
import {
  groupHasActiveItem,
  isItemActive,
  NAV_GROUPS,
  type NavGroup,
  OPERATOR_NAV_GROUP,
} from "./nav-groups";
import { type PersonaRosterEntry, RoleSwitcher } from "./RoleSwitcher";

function GroupDot({ color }: { color: string }) {
  return (
    <span
      className="size-2 shrink-0 rounded-full"
      style={{ background: color }}
      aria-hidden="true"
    />
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
    // 사용자 지시(2026-07-20): 패널 상하 공백·높이 축소 — py-3→py-1.5, 항목 min-h-11→min-h-9
    // (데스크톱 포인터 전용 패널이라 44px 터치 타깃 대신 36px 허용. 모바일 Sheet는 44px 유지)
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
 * useLayoutEffect 실측으로 우측 정렬 뒤집기). hover/포커스/클릭 전부로 열리고, "+"는
 * 열림 시 45도 회전해 닫기(×) 느낌을 준다. 현재 페이지가 이 그룹 소속이면 항상 primary.
 * 패널은 top border 없이 border-x+border-b만 두고 바 하단 라인 위로 1px 겹쳐, 바닥
 * 라인과 패널 좌우 라인이 한 윤곽선처럼 이어져 보이게 한다(폴더 탭 문법).
 *
 * top 오프셋은 실측 픽셀값이다("calc(100% - 1px)"이 아니다) — 트리거의 relative
 * wrapper는 버튼(h-11=44px) 높이만큼만 차지하는데, GNB 바 자체는 72px(min-h-[72px])이고
 * items-center로 세로 중앙 정렬돼 있어 wrapper 상하로 14px씩 여백이 남는다. 즉 wrapper
 * 기준 "100%"는 바의 실제 하단 라인이 아니라 그보다 14px 위, 버튼 자신의 바닥일 뿐이다
 * (Playwright 실측: 예전엔 패널이 바 하단선보다 15.5px 위에서 시작 — 사용자가 스크린샷으로
 * 지적한 "연결부 어긋남"의 원인). CSS만으로 고치려면 바~트리거까지 여러 겹 flex
 * align-items 체인을 stretch로 바꿔야 해서(로고·역할스위처 등 다른 요소의 기존 중앙
 * 정렬을 깰 위험) 대신 barRef와 이 트리거의 wrapperRef를 둘 다 실측해 "바 하단 - wrapper
 * 상단"을 그대로 top(px)에 대입한다 — 바 높이가 나중에 달라져도(예: 역할 스위처가 늘어나
 * 바가 72px보다 커지는 경우) 항상 정확하다.
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
          "flex h-11 items-center gap-1 px-3.5 text-sm font-normal text-guud-badge-new hover:text-primary",
          (active || isOpen) && "font-semibold text-primary",
        )}
      >
        {group.label}
        <Plus
          className={cn(
            "size-3 shrink-0 transition-transform duration-150",
            isOpen && "rotate-45",
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
              // 사용자 확정(2026-07-20): 라인 색 = #D2D2D2 (시스템 내 input 보더값 — 보이되 하나의 소프트한 인상 유지)
              "absolute z-50 w-max overflow-hidden border-x border-b border-[#D2D2D2] bg-background",
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

/** 모바일 층별 아코디언 섹션 — 색점+라벨+카운트+셰브런(열림 시 회전), 현재 페이지 소속 섹션은 기본 열림. */
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
        className="flex min-h-11 w-full items-center gap-2 px-3.5 py-3 text-left text-[13px] font-extrabold tracking-wide"
        style={{ color: group.textColor }}
      >
        <GroupDot color={group.dotColor} />
        {group.label}
        <span className="font-bold text-guud-text-muted-2">
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

export function GlobalNav({ personas }: { personas: PersonaRosterEntry[] }) {
  const pathname = usePathname();
  const role = useViewerContextStore((state) => state.role);
  // Task #38: 현재 hover/포커스로 열려 있는 대메뉴 그룹(없으면 null) — 서브 밴드가
  // 어느 그룹 내용을 보여줄지 결정한다. 150ms 유예 닫힘을 위한 타이머 ref.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 바 라인↔패널 라인 연결부 실측용 — GnbTriggerWithPanel에 그대로 내려준다.
  const barRef = useRef<HTMLDivElement | null>(null);
  const groups: NavGroup[] = [
    ...NAV_GROUPS,
    ...(role === "운영자" ? [OPERATOR_NAV_GROUP] : []),
  ];

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

  // 클릭도 activate와 동일하게 "그냥 연다"로 통일했다 — 실제 마우스 사용자는 클릭 전에
  // 항상 먼저 hover(mouseenter)를 거치므로, 클릭에서 "이미 열려 있으면 토글해서 닫는다"
  // 로직을 넣으면 hover가 이미 열어둔 걸 클릭이 곧바로 다시 닫아버리는 충돌이 생긴다
  // (Playwright로 실제 재현 — click()도 내부적으로 마우스를 그 위치로 옮긴 뒤 클릭하므로
  // 동일하게 걸린다). v4 스펙은 "클릭으로도 열림/이동 가능"만 요구하고 재클릭 닫힘은
  // 요구하지 않는다 — 닫힘은 영역 이탈·Esc·링크 이동만 담당한다.
  function activate(key: string) {
    cancelClose();
    setOpenKey(key);
  }

  // Escape 닫힘은 document 레벨 리스너로 처리한다 — 래퍼의 onKeyDown(React 합성 이벤트)은
  // 키 이벤트가 그 서브트리 안의 "포커스된" 요소에서 버블링돼야 잡히는데, hover로 연 경우
  // (이 GNB의 가장 흔한 사용 경로) 실제 포커스는 여전히 body 등 래퍼 바깥에 남아 있어
  // Escape가 전혀 안 닫히는 실측 버그가 확인됐다(Playwright로 재현). openKey가 있을 때만
  // 리스너를 붙이고 정리한다.
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
    <>
      {/* 흰 GNB 바(≥768px) — Task #38(GNB v4): 이 래퍼는 hover/focus 이탈을 감지하는
          단일 영역(바+패널 전체를 벗어나야 닫힘 타이머가 돈다). 바 하단엔 전폭 hairline.
          박스형 패널은 각 트리거 자신의 relative 컨테이너(GnbTriggerWithPanel) 아래
          붙는다 — 공유 전폭 밴드가 아니라 트리거별 정렬이라 여기 자체엔 패널이 없다. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: 이 div 자체는 상호작용
          대상이 아니다 — 실제 인터랙션 요소(버튼·링크)는 전부 안쪽에 있고, 이 래퍼는
          hover/focus가 "바+패널 영역 전체"를 벗어났는지 감지하는 이벤트 경계일 뿐이다
          (마우스 이탈 시 150ms 유예 닫힘 — 대각선 이동 허용). role 부여는 시맨틱을
          왜곡한다. */}
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
          className="flex min-h-[72px] items-center justify-between border-b border-[#D2D2D2] bg-background px-[30px]"
        >
          <div className="flex items-center">
            <span className="font-heading text-lg font-bold text-foreground">
              AX 플랫폼
            </span>
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
          </div>
          <div className="flex items-center gap-4">
            <RoleSwitcher
              personas={personas}
              roleFieldsetClassName="hidden lg:flex"
            />
          </div>
        </div>
      </div>

      {/* 모바일(<768px): 로고 + 햄버거 한 행 + Sheet(아코디언) — hana는 모바일 미관측이라
          기존 검증된 아코디언 패턴은 유지하되, 로고는 데스크톱과 마찬가지로 항상 노출한다. */}
      <div className="flex items-center justify-between border-t border-guud-hairline bg-background px-[30px] py-2 md:hidden">
        <span className="font-heading text-lg font-bold text-foreground">
          AX 플랫폼
        </span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="min-h-11 gap-1.5">
              <Menu className="size-4" aria-hidden />
              메뉴
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>전역 내비게이션</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-4">
              {/* 역할 스위처를 헤더에서 옮겨옴(모바일 헤더 폭 절약, mp-persona 패턴) */}
              <RoleSwitcher personas={personas} className="flex-wrap gap-2" />
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
