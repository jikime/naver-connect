import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProfileStateForUser } from "@/lib/server/profile-repository";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }
  if (session.user.role === "운영자") {
    return NextResponse.json(
      { error: "운영자 계정에는 회원 프로필이 없습니다." },
      { status: 403 },
    );
  }
  const profile = await getProfileStateForUser(session.user.id);
  if (!profile) {
    return NextResponse.json(
      { error: "프로필을 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  return NextResponse.json(profile);
}
