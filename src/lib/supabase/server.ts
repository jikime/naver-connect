import "server-only";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CORE_SCHEMA } from "@/lib/supabase/constants";

/**
 * 서버 전용 Supabase 클라이언트.
 *
 * SUPABASE_SECRET_KEY는 RLS를 우회할 수 있으므로 Route Handler·Server Component·DAL
 * 밖으로 반환하거나 NEXT_PUBLIC_ 환경변수에 담으면 안 된다.
 */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Supabase 서버 환경변수가 없습니다. .env.local의 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SECRET_KEY를 확인하세요.",
    );
  }

  return createClient(url, secretKey, {
    db: { schema: SUPABASE_CORE_SCHEMA },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
