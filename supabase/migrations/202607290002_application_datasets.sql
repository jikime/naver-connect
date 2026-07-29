-- 기존 프로토타입 데이터의 운영 DB 정본과 심사용 계정 연결

alter table ax_private.auth_users
  add column if not exists persona_id text;

update ax_private.auth_users
set persona_id = id::text
where persona_id is null;

alter table ax_private.auth_users
  alter column persona_id set not null;

create unique index if not exists auth_users_persona_id_uidx
  on ax_private.auth_users (persona_id);

comment on column ax_private.auth_users.persona_id is
  '도메인 회원 식별자. 기존 데이터는 M-xxx, 신규 가입자는 사용자 UUID를 사용한다.';

create table if not exists ax_core.datasets (
  dataset_key text primary key check (dataset_key ~ '^[a-z0-9-]+$'),
  document jsonb not null,
  source_path text not null,
  source_sha256 text not null check (char_length(source_sha256) = 64),
  record_count integer not null check (record_count >= 0),
  revision integer not null default 1 check (revision > 0),
  seeded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ax_private.datasets (
  dataset_key text primary key check (dataset_key ~ '^[a-z0-9-]+$'),
  document jsonb not null,
  source_path text not null,
  source_sha256 text not null check (char_length(source_sha256) = 64),
  record_count integer not null check (record_count >= 0),
  revision integer not null default 1 check (revision > 0),
  seeded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ax_private.user_runtime_states (
  user_id uuid primary key references ax_private.auth_users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists core_datasets_set_updated_at on ax_core.datasets;
create trigger core_datasets_set_updated_at
before update on ax_core.datasets
for each row execute function ax_private.set_updated_at();

drop trigger if exists private_datasets_set_updated_at on ax_private.datasets;
create trigger private_datasets_set_updated_at
before update on ax_private.datasets
for each row execute function ax_private.set_updated_at();

drop trigger if exists user_runtime_states_set_updated_at
  on ax_private.user_runtime_states;
create trigger user_runtime_states_set_updated_at
before update on ax_private.user_runtime_states
for each row execute function ax_private.set_updated_at();

alter table ax_core.datasets enable row level security;
alter table ax_private.datasets enable row level security;
alter table ax_private.user_runtime_states enable row level security;

revoke all on ax_core.datasets
  from public, anon, authenticated, service_role;
revoke all on ax_private.datasets
  from public, anon, authenticated, service_role;
revoke all on ax_private.user_runtime_states
  from public, anon, authenticated, service_role;

comment on table ax_core.datasets is
  '서버 DAL이 제공하는 공개 가능 기준정보·콘텐츠의 DB 정본.';
comment on table ax_private.datasets is
  '동의, 매칭 원문, 거래 등 서버에서만 접근하는 비공개 데이터 정본.';
comment on table ax_private.user_runtime_states is
  '사용자별 거절·검토·선호·진행 상태. 브라우저 저장소를 대체한다.';
