import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/auth/types";

declare module "next-auth" {
  interface User {
    role: UserRole;
    personaId: string;
    onboardingComplete: boolean;
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      personaId: string;
      onboardingComplete: boolean;
      sessionVersion: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    personaId: string;
    onboardingComplete: boolean;
    sessionVersion: number;
  }
}
