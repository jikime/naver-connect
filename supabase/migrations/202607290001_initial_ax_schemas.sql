-- AX 플랫폼 운영 인증·프로필 기반 스키마
-- ax_private: 계정, 비밀번호 해시, 온보딩 원문과 동의 기록
-- ax_core: 사용자에게 공개할 수 있는 프로필 데이터
-- 두 스키마 모두 Supabase Data API에 노출하지 않고 서버의 직접 PG 연결만 사용한다.

create schema if not exists ax_core;
create schema if not exists ax_private;

revoke all on schema ax_core from public, anon, authenticated, service_role;
revoke all on schema ax_private from public, anon, authenticated, service_role;

comment on schema ax_core is
  'AX 플랫폼 공개 가능 도메인 데이터. 애플리케이션 서버를 통해서만 접근한다.';
comment on schema ax_private is
  'AX 플랫폼 계정 및 민감 데이터. Supabase Data API에 노출하지 않는다.';

create table if not exists ax_private.schema_migrations (
  version text primary key,
  checksum text not null,
  applied_at timestamptz not null default now()
);

create table if not exists ax_private.auth_users (
  id uuid primary key default gen_random_uuid(),
  email text not null check (
    email = lower(btrim(email))
    and char_length(email) between 3 and 254
  ),
  password_hash text not null check (char_length(password_hash) between 50 and 100),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 80),
  role text not null check (role in ('기업가', '전문가', '운영자')),
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  onboarding_completed_at timestamptz,
  email_verified_at timestamptz,
  failed_sign_in_count integer not null default 0 check (failed_sign_in_count >= 0),
  locked_until timestamptz,
  last_sign_in_at timestamptz,
  session_version integer not null default 1 check (session_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists auth_users_email_lower_uidx
  on ax_private.auth_users (lower(email));
create index if not exists auth_users_status_idx
  on ax_private.auth_users (status);

create table if not exists ax_core.profiles (
  id uuid primary key references ax_private.auth_users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 80),
  role text not null check (role in ('기업가', '전문가', '운영자')),
  organization_name text,
  organization_type text,
  organization_role text,
  region_sido text,
  region_sigungu text,
  field_tag_ids integer[] not null default '{}',
  value_chain_stage text,
  mission_statement text,
  supply_tags jsonb not null default '[]'::jsonb check (jsonb_typeof(supply_tags) = 'array'),
  activities text[] not null default '{}',
  preferred_mode text,
  profile_visibility text not null default 'private'
    check (profile_visibility in ('private', 'network', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on ax_core.profiles (role);
create index if not exists profiles_field_tags_gin_idx
  on ax_core.profiles using gin (field_tag_ids);

create table if not exists ax_private.onboarding_profiles (
  user_id uuid primary key references ax_private.auth_users(id) on delete cascade,
  profile_revision integer not null default 0 check (profile_revision >= 0),
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  consents jsonb not null default '{}'::jsonb check (jsonb_typeof(consents) = 'object'),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ax_private.auth_events (
  id bigint generated always as identity primary key,
  auth_user_id uuid references ax_private.auth_users(id) on delete set null,
  event_type text not null check (
    event_type in (
      'signup',
      'signin_success',
      'signin_failure',
      'account_locked',
      'signout',
      'onboarding_completed'
    )
  ),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists auth_events_user_created_idx
  on ax_private.auth_events (auth_user_id, created_at desc);

create or replace function ax_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end
$function$;

drop trigger if exists auth_users_set_updated_at on ax_private.auth_users;
create trigger auth_users_set_updated_at
before update on ax_private.auth_users
for each row execute function ax_private.set_updated_at();

drop trigger if exists profiles_set_updated_at on ax_core.profiles;
create trigger profiles_set_updated_at
before update on ax_core.profiles
for each row execute function ax_private.set_updated_at();

drop trigger if exists onboarding_profiles_set_updated_at
  on ax_private.onboarding_profiles;
create trigger onboarding_profiles_set_updated_at
before update on ax_private.onboarding_profiles
for each row execute function ax_private.set_updated_at();

alter table ax_private.schema_migrations enable row level security;
alter table ax_private.auth_users enable row level security;
alter table ax_private.onboarding_profiles enable row level security;
alter table ax_private.auth_events enable row level security;
alter table ax_core.profiles enable row level security;

revoke all on all tables in schema ax_core
  from public, anon, authenticated, service_role;
revoke all on all sequences in schema ax_core
  from public, anon, authenticated, service_role;
revoke all on all tables in schema ax_private
  from public, anon, authenticated, service_role;
revoke all on all sequences in schema ax_private
  from public, anon, authenticated, service_role;
revoke execute on all functions in schema ax_private
  from public, anon, authenticated, service_role;

alter default privileges in schema ax_core
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema ax_core
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges in schema ax_private
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema ax_private
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges in schema ax_private
  revoke execute on functions from public, anon, authenticated, service_role;

comment on table ax_private.auth_users is
  'Auth.js Credentials 계정 정본. 비밀번호는 bcrypt 해시만 저장한다.';
comment on table ax_private.onboarding_profiles is
  '사용자가 입력한 온보딩 원문과 동의 기록. 외부 API에 직접 노출하지 않는다.';
comment on table ax_core.profiles is
  '사용자가 공개에 동의한 범위에서 서비스가 제공하는 프로필.';
