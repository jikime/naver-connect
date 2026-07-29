import type { MaskedMember, OnboardingFinalizeInput } from "@/types";

export interface MyProfileState {
  member: MaskedMember;
  onboardingComplete: boolean;
  onboarding: OnboardingFinalizeInput | null;
}

export async function getMyProfileState(): Promise<MyProfileState> {
  const response = await fetch("/api/profile/me", { cache: "no-store" });
  const payload = (await response.json()) as Partial<MyProfileState> & {
    error?: string;
  };
  if (
    !response.ok ||
    !payload.member ||
    typeof payload.onboardingComplete !== "boolean"
  ) {
    throw new Error(payload.error ?? "프로필을 불러오지 못했습니다.");
  }
  return {
    member: payload.member,
    onboardingComplete: payload.onboardingComplete,
    onboarding: payload.onboarding ?? null,
  };
}

export async function getMyProfile(): Promise<MaskedMember> {
  const profile = await getMyProfileState();
  return profile.member;
}
