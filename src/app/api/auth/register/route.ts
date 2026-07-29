import { NextResponse } from "next/server";
import { registrationSchema } from "@/lib/auth/validation";
import {
  createUser,
  EmailAlreadyExistsError,
} from "@/lib/server/auth-repository";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "허용되지 않은 요청입니다." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식을 확인해주세요." },
      { status: 400 },
    );
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." },
      { status: 400 },
    );
  }

  try {
    const user = await createUser(parsed.data);
    return NextResponse.json(
      { user: { id: user.id, name: user.name, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof EmailAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("회원가입 처리 실패", error);
    return NextResponse.json(
      { error: "회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
