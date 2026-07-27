// 해커톤 출품용 인증 세션 — 브라우저 localStorage에 로그인 상태만 보존하는 UI 프로토타입.
// 실제 서비스에서는 이 스토어의 signIn/signUp을 서버 인증·세션 쿠키로 교체해야 한다.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  OPERATOR_PERSONA_ID,
  useViewerContextStore,
} from "@/stores/viewer-context";
import type { ViewerContext } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: ViewerContext["role"];
  personaId: string;
  onboardingComplete: boolean;
}

export interface DemoAccount {
  role: ViewerContext["role"];
  email: string;
  password: string;
  user: AuthUser;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "기업가",
    email: "founder@ax-demo.kr",
    password: "ax2026",
    user: {
      id: "demo-founder",
      name: "김서연",
      email: "founder@ax-demo.kr",
      role: "기업가",
      personaId: "M-001",
      onboardingComplete: true,
    },
  },
  {
    role: "전문가",
    email: "expert@ax-demo.kr",
    password: "ax2026",
    user: {
      id: "demo-expert",
      name: "정민철",
      email: "expert@ax-demo.kr",
      role: "전문가",
      personaId: "M-005",
      onboardingComplete: true,
    },
  },
  {
    role: "운영자",
    email: "operator@ax-demo.kr",
    password: "ax2026",
    user: {
      id: "demo-operator",
      name: "AX 운영자",
      email: "operator@ax-demo.kr",
      role: "운영자",
      personaId: OPERATOR_PERSONA_ID,
      onboardingComplete: true,
    },
  },
];

function syncViewer(user: AuthUser | null) {
  const viewerStore = useViewerContextStore.getState();
  if (user) {
    viewerStore.setViewer({ role: user.role, personaId: user.personaId });
  } else {
    viewerStore.reset();
  }
}

interface AuthSessionStore {
  user: AuthUser | null;
  hasHydrated: boolean;
  signIn: (user: AuthUser) => void;
  signUp: (input: {
    name: string;
    email: string;
    role: "기업가" | "전문가";
  }) => void;
  completeOnboarding: () => void;
  signOut: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthSessionStore = create<AuthSessionStore>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,
      signIn: (user) => {
        syncViewer(user);
        set({ user });
      },
      signUp: ({ name, email, role }) => {
        const user: AuthUser = {
          id: `signup-${email.trim().toLowerCase()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          personaId: role === "기업가" ? "M-001" : "M-005",
          onboardingComplete: false,
        };
        syncViewer(user);
        set({ user });
      },
      completeOnboarding: () =>
        set((state) => ({
          user: state.user ? { ...state.user, onboardingComplete: true } : null,
        })),
      signOut: () => {
        syncViewer(null);
        set({ user: null });
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "ax-auth-session",
      skipHydration: true,
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: (currentState) => (rehydratedState) => {
        const state = rehydratedState ?? currentState;
        syncViewer(state.user);
        state.setHasHydrated(true);
      },
    },
  ),
);

export function getDemoAccount(role: ViewerContext["role"]): DemoAccount {
  const account = DEMO_ACCOUNTS.find((item) => item.role === role);
  if (!account) {
    throw new Error(`지원하지 않는 역할입니다: ${role}`);
  }
  return account;
}
