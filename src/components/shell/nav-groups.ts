// GlobalNav 그룹 데이터 — To-Be 메뉴 개편(Task #31, team-lead 승인 개선안
// /Users/jikime/Downloads/naver-connect_menu-ui-proposal_5.html 그대로).
// 근거: naver-connect_process-map.pptx 3번 슬라이드 층 구조. 4개 층 + 조건부 "운영 관리".
//
// 색상은 앱 전역 hana 크로스워크 토큰(guud-*)과 무관한 "로컬 기능 팔레트"다 — 지식 그래프의
// KG_TYPE_META(graph-meta.ts)와 동일한 패턴: 브랜드 토큰이 아니라 이 메뉴 그룹 전용 hex를
// 하드코딩하고 인라인 style로 적용한다(개선안 프로세스맵 팔레트 그대로 재사용, 앱 크롬은 불변).

export interface NavItem {
  href: string;
  label: string;
  /** 소메뉴 한 줄 설명 — 각 라우트 실제 페이지 h1/설명 문구에서 그대로 축약(창작 아님) */
  description: string;
}

export interface NavGroup {
  key: string;
  label: string;
  /** 그룹 라벨 텍스트 색(대비 확보용 — amber는 dotColor보다 어두운 ink 변형을 쓴다) */
  textColor: string;
  /** 그룹 점(dot) 색 — 개선안 프로세스맵 원색 */
  dotColor: string;
  /** 태블릿 카드 배경(소프트 틴트) */
  softBg: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "relationship",
    label: "관계 형성",
    textColor: "#1C7293",
    dotColor: "#1C7293",
    softBg: "#E4F0F2",
    items: [
      {
        href: "/onboarding",
        label: "온보딩",
        description: "7단계 위저드로 프로필·수요·공급을 등록해요",
      },
      {
        href: "/profile",
        label: "프로필",
        description: "공개/비공개 프로필 카드를 확인·수정해요",
      },
      {
        href: "/ecosystem",
        label: "생태계맵",
        description: "밸류체인 단계별 5-force 이해관계자와 단체를 봐요",
      },
      {
        href: "/recommendations",
        label: "주간추천",
        description: "공통점·차이점 많은 회원 추천을 매주 받아요",
      },
      {
        href: "/collab-cases",
        label: "협업사례",
        description: "진행된 협업 사례를 보고 조합을 시뮬레이션해요",
      },
      {
        href: "/meetups",
        label: "모듬",
        description: "유형·분야·지역으로 모듬을 찾아 참여해요",
      },
    ],
  },
  {
    key: "opportunity",
    label: "기회 발굴",
    textColor: "#8A5A00", // amber-ink — amber(#F2A541)는 흰 배경 위 텍스트 대비가 약해 라벨은 ink 변형 사용
    dotColor: "#F2A541",
    softBg: "#FDF3E2",
    items: [
      {
        href: "/gap-report",
        label: "사업기회 발굴",
        description: "지역 격차·커버리지·기회 카드를 한 화면에서 봐요",
      },
      {
        href: "/proposals",
        label: "제안 트래킹",
        description: "제안된 프로젝트를 검토→성사 단계로 관리해요",
      },
      {
        href: "/knowledge-graph",
        label: "지식 그래프",
        description: "회원·조직·딜룸·문서 연결을 한 화면에서 봐요",
      },
      {
        href: "/knowledge-graph/galaxy",
        label: "지식 그래프 · 은하",
        description: "분야를 항성으로, 회원·조직·산출물이 공전하는 은하 뷰",
      },
    ],
  },
  {
    key: "execution",
    label: "사업 실행",
    textColor: "#0B3C49",
    dotColor: "#0B3C49",
    softBg: "#E5EBEC",
    items: [
      {
        href: "/deal-rooms",
        label: "딜룸",
        description: "5단계 파이프라인으로 내 딜 현황을 확인해요",
      },
      {
        href: "/deal-sourcing",
        label: "딜소싱",
        description: "협업 프로젝트를 등록해 딜룸 씨앗으로 반영해요",
      },
    ],
  },
  {
    key: "support",
    label: "지원 서비스",
    textColor: "#5B6B73",
    dotColor: "#5B6B73",
    softBg: "#EEF1F2",
    items: [
      {
        href: "/resources",
        label: "자원검색",
        description: "분야·지역에 맞는 정책사업 공고를 찾아요",
      },
      {
        href: "/finance",
        label: "금융 서비스",
        description: "프로젝트에 맞는 금융기관·상품을 제안받아요",
      },
      {
        href: "/backoffice",
        label: "백오피스",
        description: "전문가 서비스 카탈로그와 공동구매를 확인해요",
      },
      {
        href: "/search",
        label: "회원 검색",
        description: "이름·조직·키워드로 다른 회원을 찾아요",
      },
    ],
  },
];

/**
 * 운영자 전용 5번째 그룹 — 개선안 목업에는 없다(원본엔 운영자 메뉴가 반영 안 됨). team-lead 지시로
 * 같은 문법(색점+라벨+카운트)으로 추가하되 색은 hana primary-ink(#002A22, guud-badge-new 토큰의
 * 실값과 동일 — globals.css 참조)를 재사용해 "운영"이 곧 브랜드 잉크색이라는 위계를 준다.
 * softBg는 개선안에 지정이 없어 hana의 기존 브랜드 틴트(badge-tint #F2FAF8, guud-header-band와
 * 동일 값)를 재사용했다 — 운영 잉크색과 같은 브랜드 계열이라 임의 신규색 없이 자연스럽게 어울린다.
 */
export const OPERATOR_NAV_GROUP: NavGroup = {
  key: "operator",
  label: "운영 관리",
  textColor: "#002A22",
  dotColor: "#002A22",
  softBg: "#F2FAF8",
  items: [
    {
      href: "/operator/review",
      label: "검수",
      description: "생성된 추천을 전건 검수하고 승인/반려해요",
    },
    {
      href: "/operator/kpi",
      label: "KPI",
      description: "1단계 6종 지표를 목표선 대비 확인해요",
    },
    {
      href: "/admin/rules",
      label: "추천 룰",
      description: "키워드 가중치로 매칭 점수를 조정해요",
    },
  ],
};

export function isItemActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function groupHasActiveItem(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => isItemActive(item.href, pathname));
}
