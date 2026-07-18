// 온보딩 위저드 초안 상태 + 선택지 상수. OnbWizard(셸)와 스텝 컴포넌트가 공유한다.
// 근거: TASKS.md T-009a/T-009b, ARCHITECTURE.md §4.2(Member/InterviewScript 스키마), FR-ON-01~11
//
// activities/availability/preferred_mode 선택지는 members.json에 실제 등장하는 값들에서
// 지역 접미사를 뗀 공통 어휘로 추출했다(시드 창작 아님 — 위저드가 새로 수집하는 회원 응답의
// 입력 보기일 뿐, 시드 수치·원문은 그대로 둔다, BR-02/BR-10).

export interface DemandSelection {
  tagId: number;
  priority: boolean;
}

export interface SupplySelection {
  tagId: number;
  detail: string;
}

export interface TrustConnectionDraft {
  type: "소개자" | "아는회원" | "소속모임";
  ref: string;
}

/** FollowupQuestionStep(스텝6)이 1턴 1질문으로 쌓는 대화 기록. detail_quote 원문 보존(BR-02). */
export interface FollowupAnswer {
  kind: "demand" | "supply" | "hot_lead";
  tagId?: number;
  question: string;
  answer: string;
}

export interface OnboardingDraft {
  // 스텝1 — 프로필 확인, FR-ON-01 7항목(조직명·유형·역할·지역·분야·밸류체인·미션·신뢰연결점)
  orgName: string;
  orgType: string;
  orgRole: string;
  sido: string;
  sigungu: string;
  fieldTags: number[];
  valueChainStage: string;
  missionStatement: string;
  trustConnections: TrustConnectionDraft[];

  // 스텝2 — 수요 3택 + ★최우선 1(FR-ON-02)
  demandSelections: DemandSelection[];

  // 스텝3 — 공급 3택(FR-ON-03)
  supplySelections: SupplySelection[];

  // 스텝4 — 협력성향 4문항(FR-ON-04)
  activities: string[];
  availability: string;
  preferredMode: string;
  readiness: string;

  // 스텝6 — AI 후속질문 답변(FR-ON-05/06/11)
  followupAnswers: FollowupAnswer[];
  followupDone: boolean;

  // 스텝7 — 공개범위 동의(FR-ON-08)
  visibilityConsent: boolean;
}

export const HOT_LEAD_READINESS = "구체적 프로젝트 있음";

/** BR-14: 금지질문 없음 — 4개 모두 중립적 운영 선호 질문. */
export const READINESS_OPTIONS = [
  "아직 구상 단계예요",
  "관심있는 협업이면 환영해요",
  HOT_LEAD_READINESS,
  "지금은 여유가 없어요",
] as const;

export const ACTIVITY_OPTIONS = [
  "학습모임",
  "공동사업협업",
  "멘토링받기",
  "멘토링하기",
  "취미모임",
  "공동연구",
] as const;

export const AVAILABILITY_OPTIONS = [
  "주 1회 이상",
  "월 2~3회",
  "월 1회 이하",
  "주말 위주",
] as const;

export const PREFERRED_MODE_OPTIONS = [
  "오프라인 선호",
  "온라인·오프라인 무관",
  "무관",
] as const;

export const TRUST_CONNECTION_TYPES = [
  "소개자",
  "아는회원",
  "소속모임",
] as const;

export function isHotLead(readiness: string): boolean {
  return readiness === HOT_LEAD_READINESS;
}

export function createEmptyDraft(): OnboardingDraft {
  return {
    orgName: "",
    orgType: "",
    orgRole: "",
    sido: "",
    sigungu: "",
    fieldTags: [],
    valueChainStage: "",
    missionStatement: "",
    trustConnections: [],
    demandSelections: [],
    supplySelections: [],
    activities: [],
    availability: "",
    preferredMode: "",
    readiness: "",
    followupAnswers: [],
    followupDone: false,
    visibilityConsent: false,
  };
}

export const TOTAL_STEPS = 7;

export const STEP_TITLES = [
  "프로필 확인",
  "수요 태그 선택",
  "공급 태그 선택",
  "협력 성향",
  "민감정보 고지",
  "AI 후속질문",
  "프로필 확정",
] as const;
