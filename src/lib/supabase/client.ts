"use client";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CORE_SCHEMA } from "@/lib/supabase/constants";

function createConfiguredClient(url: string, publishableKey: string) {
  return createClient(url, publishableKey, {
    db: { schema: SUPABASE_CORE_SCHEMA },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

type AxCoreBrowserClient = ReturnType<typeof createConfiguredClient>;

let browserClient: AxCoreBrowserClient | undefined;

/**
 * 브라우저용 Supabase 클라이언트.
 *
 * 인증 세션은 Auth.js가 관리하므로 Supabase Auth 세션 저장은 끈다. ax_core에도
 * anon 권한을 주지 않기 때문에 현재 클라이언트는 연결 준비용이며 민감 조회에 쓰지 않는다.
 */
export function getSupabaseBrowserClient(): AxCoreBrowserClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Supabase 공개 환경변수가 없습니다. .env.local의 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 확인하세요.",
    );
  }

  browserClient = createConfiguredClient(url, publishableKey);
  return browserClient;
}
