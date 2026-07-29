import { auth } from "@/auth";
import {
  getRuntimeStateForUser,
  RUNTIME_STATE_KEYS,
  type RuntimeStateKey,
  setRuntimeStateValue,
} from "@/lib/server/runtime-state-repository";

export const dynamic = "force-dynamic";

const SERVER_MANAGED_KEYS = new Set<RuntimeStateKey>([
  "onboardingFinalized",
  "onboardingResults",
]);

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }
  const result = await getRuntimeStateForUser(session.user.id);
  return Response.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return Response.json(
      { message: "허용되지 않은 요청입니다." },
      { status: 403 },
    );
  }
  const raw = await request.text();
  if (raw.length > 500_000) {
    return Response.json(
      { message: "저장할 데이터가 너무 큽니다." },
      { status: 413 },
    );
  }
  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return Response.json({ message: "잘못된 JSON입니다." }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("key" in body) ||
    typeof body.key !== "string" ||
    !RUNTIME_STATE_KEYS.includes(body.key as RuntimeStateKey) ||
    !("value" in body)
  ) {
    return Response.json(
      { message: "잘못된 상태 변경입니다." },
      { status: 400 },
    );
  }
  const key = body.key as RuntimeStateKey;
  if (SERVER_MANAGED_KEYS.has(key)) {
    return Response.json(
      { message: "서버에서만 변경할 수 있는 상태입니다." },
      { status: 403 },
    );
  }
  if (key === "ruleWeightOverrides" && session.user.role !== "운영자") {
    return Response.json(
      { message: "운영자만 추천 가중치를 변경할 수 있습니다." },
      { status: 403 },
    );
  }
  const result = await setRuntimeStateValue(session.user.id, key, body.value);
  return Response.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
