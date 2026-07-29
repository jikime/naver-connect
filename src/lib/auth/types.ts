export const USER_ROLES = ["기업가", "전문가", "운영자"] as const;
export const SELF_REGISTRATION_ROLES = ["기업가", "전문가"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type SelfRegistrationRole = (typeof SELF_REGISTRATION_ROLES)[number];

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  personaId: string;
  onboardingComplete: boolean;
  sessionVersion: number;
}
