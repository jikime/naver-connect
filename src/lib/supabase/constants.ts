/**
 * Supabase 스키마 경계.
 *
 * ax_core는 화면용 비민감 데이터, ax_private는 계정과 민감 데이터를 보관한다.
 * 식별자를 환경변수로 받지 않아 SQL 식별자 주입과 배포 환경별 스키마 불일치를 막는다.
 */
export const SUPABASE_CORE_SCHEMA = "ax_core" as const;
export const SUPABASE_PRIVATE_SCHEMA = "ax_private" as const;
