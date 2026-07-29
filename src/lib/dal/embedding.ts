import type { MemberEmbeddingShadow, PublicEmbeddingProfile } from "@/types";

export type PublicEmbeddingTransport = (
  profile: PublicEmbeddingProfile,
) => Promise<MemberEmbeddingShadow>;

let transport: PublicEmbeddingTransport | null = null;

export function setPublicEmbeddingTransport(
  nextTransport: PublicEmbeddingTransport | null,
): void {
  transport = nextTransport;
}

/**
 * 공개 온보딩 프로필을 KURE 회원 공간에 투영한다.
 * 원문 수요·safe_match_text·동의 세부값은 이 경계를 통과하지 않는다.
 */
export async function embedPublicProfile(
  profile: PublicEmbeddingProfile,
): Promise<MemberEmbeddingShadow> {
  if (transport) return transport(profile);
  const response = await fetch("/api/embedding/member-position", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  if (!response.ok) {
    throw new Error(`회원 임베딩 생성 실패 (${response.status})`);
  }
  return (await response.json()) as MemberEmbeddingShadow;
}
