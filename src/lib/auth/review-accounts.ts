import type { UserRole } from "./types";

export interface ReviewAccount {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  personaId: string;
}

export const REVIEW_ACCOUNTS: readonly ReviewAccount[] = [
  {
    role: "기업가",
    name: "김서연",
    email: "founder@ax-demo.kr",
    password: "ax2026",
    personaId: "M-001",
  },
  {
    role: "전문가",
    name: "정민철",
    email: "expert@ax-demo.kr",
    password: "ax2026",
    personaId: "M-005",
  },
  {
    role: "운영자",
    name: "AX 운영자",
    email: "operator@ax-demo.kr",
    password: "ax2026",
    personaId: "OPERATOR",
  },
] as const;
