-- ============================================================
-- nvc_ people 도메인 DDL 초안 v0.1 — ⚠️ 실행 금지 (DRAFT ONLY)
-- 실행 조건(전부 충족 전 실행 불가): ① 사용자 명시 승인 ② 유효한 직접 PG DATABASE_URL
--   ③ `vector` extension 확인 ④ 대상 프로젝트 재확인(현 Supabase는 다른 앱과 공유 —
--   app_secret/asset/audit_log/channel_status/content_item/profile/timeliness_candidate는 불가침)
-- 근거: people_match_retrieval_plan.md §4, research_synthesis.md §13, plans/generic-mixing-seahorse.md M0-5
-- 원칙: nvc_ prefix로 기존 두 서비스와 격리. 원문(detail_quote)과 safe_match_text 분리 저장.
--       벡터 차원은 모델 확정(M2 비교) 후 기입 — placeholder 주석.
-- ============================================================

-- 사람 안정 ID (자기소개·경험·연락처는 여기 두지 않는다)
CREATE TABLE IF NOT EXISTS nvc_people (
  id               TEXT PRIMARY KEY,
  auth_user_id     UUID,
  display_name     TEXT NOT NULL,
  discoverable     BOOLEAN DEFAULT FALSE,
  onboarding_state TEXT DEFAULT 'pending',
  current_revision INTEGER DEFAULT 1,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 사람 ↔ 기존 organizations(80) 연결
CREATE TABLE IF NOT EXISTS nvc_affiliations (
  id                    TEXT PRIMARY KEY,
  person_id             TEXT NOT NULL REFERENCES nvc_people(id),
  organization_id       TEXT NOT NULL REFERENCES organizations(id),
  role_concept_id       TEXT,
  acting_capacity       TEXT CHECK (acting_capacity IN ('personal','organization_member','organization_representative')),
  representation_status TEXT,
  period_from           DATE,
  period_until          DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 복수·맥락별 역할 (표시 문자열 저장 금지 — concept_id + vocabulary_version)
CREATE TABLE IF NOT EXISTS nvc_role_assertions (
  id                 TEXT PRIMARY KEY,
  person_id          TEXT NOT NULL REFERENCES nvc_people(id),
  concept_id         TEXT NOT NULL,
  vocabulary_version TEXT NOT NULL,
  context_kind       TEXT CHECK (context_kind IN ('personal','organization','project')),
  context_ref_id     TEXT,
  acting_capacity    TEXT,
  active_from        TIMESTAMPTZ,
  active_until       TIMESTAMPTZ
);

-- 방향성 query — 민감. detail_quote 원문과 safe_match_text(사용자 승인) 분리
CREATE TABLE IF NOT EXISTS nvc_need_intents (
  id                TEXT PRIMARY KEY,
  owner_kind        TEXT NOT NULL CHECK (owner_kind IN ('person','organization','project')),
  owner_id          TEXT NOT NULL,
  tag_ids           INTEGER[] NOT NULL,
  detail_quote      TEXT NOT NULL,          -- 원문 — RLS로 본인·운영자만
  safe_match_text   TEXT,                   -- PII 제거 + 사용자 승인분만 임베딩 입력
  safe_match_status TEXT DEFAULT 'draft' CHECK (safe_match_status IN ('draft','user_confirmed')),
  -- 승인 영수증 5컬럼: user_confirmed면 5컬럼 전부 NOT NULL 계약(재리뷰 REJECT #4).
  -- 검증은 src/lib/matching/receipt.ts verifySafeMatchReceipt()와 동일 규칙:
  -- confirmer=owner_id, source_revision=profile_revision, content_hash=sha256(safe_match_text).
  safe_match_confirmed_at        TIMESTAMPTZ,
  safe_match_confirmer           TEXT,
  safe_match_source_revision     INTEGER,
  safe_match_content_hash        TEXT,
  safe_match_consent_receipt_id  TEXT,
  priority          TEXT CHECK (priority IN ('primary','normal')),
  urgency           TEXT CHECK (urgency IN ('exploring','active','time_sensitive')),
  constraints       JSONB DEFAULT '[]',
  status            TEXT DEFAULT 'active' CHECK (status IN ('active','paused','expired')),
  valid_until       TIMESTAMPTZ,
  source            TEXT,
  profile_revision  INTEGER NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT nvc_need_intents_safe_match_receipt CHECK (
    safe_match_status <> 'user_confirmed'
    OR (
      safe_match_confirmed_at IS NOT NULL
      AND safe_match_confirmer IS NOT NULL
      AND safe_match_source_revision IS NOT NULL
      AND safe_match_content_hash IS NOT NULL
      AND safe_match_consent_receipt_id IS NOT NULL
    )
  )
);

-- 방향성 candidate — 공개층
CREATE TABLE IF NOT EXISTS nvc_capability_offers (
  id               TEXT PRIMARY KEY,
  owner_kind       TEXT NOT NULL,
  owner_id         TEXT NOT NULL,
  tag_ids          INTEGER[] NOT NULL,
  detail           TEXT NOT NULL,
  resource_types   TEXT[],
  evidence_refs    TEXT[],
  capacity_status  TEXT CHECK (capacity_status IN ('open','limited','paused')),
  capacity_max     INTEGER,
  status           TEXT DEFAULT 'active',
  valid_until      TIMESTAMPTZ,
  source           TEXT,
  profile_revision INTEGER NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 거울형 공통점 축
CREATE TABLE IF NOT EXISTS nvc_impact_intents (
  id               TEXT PRIMARY KEY,
  owner_kind       TEXT NOT NULL,
  owner_id         TEXT NOT NULL,
  change_statement TEXT NOT NULL,
  field_ids        INTEGER[],
  geography        JSONB,
  source           TEXT,
  profile_revision INTEGER NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nvc_experiences (
  id                 TEXT PRIMARY KEY,
  person_id          TEXT NOT NULL REFERENCES nvc_people(id),
  safe_summary       TEXT NOT NULL,
  period             TEXT,
  outcome            TEXT,
  collaborator_types TEXT[],
  evidence_refs      TEXT[],
  visibility         TEXT CHECK (visibility IN ('public','matching_private')),
  source             TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 목적별 동의 영수증 — 철회 시 벡터·캐시 삭제 cascade의 근거
CREATE TABLE IF NOT EXISTS nvc_consent_records (
  id             TEXT PRIMARY KEY,
  person_id      TEXT NOT NULL REFERENCES nvc_people(id),
  purpose        TEXT NOT NULL,
  scope          TEXT,
  processor      TEXT,
  retention      TEXT,
  policy_version TEXT NOT NULL,
  consented_at   TIMESTAMPTZ NOT NULL,
  withdrawn_at   TIMESTAMPTZ,
  source         TEXT DEFAULT 'user_action'
);

-- versioned vocabulary (src/data/vocabulary/* 1:1 대응)
CREATE TABLE IF NOT EXISTS nvc_term_concepts (
  concept_id     TEXT PRIMARY KEY,
  canonical_code TEXT UNIQUE NOT NULL,
  definition     TEXT NOT NULL,
  broader_ids    TEXT[],
  status         TEXT CHECK (status IN ('draft','in_review','active','retired'))
);
CREATE TABLE IF NOT EXISTS nvc_term_label_revisions (
  revision_id   TEXT PRIMARY KEY,
  concept_id    TEXT NOT NULL REFERENCES nvc_term_concepts(concept_id),
  locale        TEXT NOT NULL,
  label         TEXT NOT NULL,
  label_kind    TEXT CHECK (label_kind IN ('preferred','alternative','deprecated','blocked')),
  valid_from    TIMESTAMPTZ NOT NULL,
  valid_until   TIMESTAMPTZ,
  change_reason TEXT NOT NULL,
  proposed_by   TEXT
);
CREATE TABLE IF NOT EXISTS nvc_vocabulary_releases (
  version      TEXT PRIMARY KEY,
  released_at  TIMESTAMPTZ NOT NULL,
  approved_by  TEXT[]
);
CREATE TABLE IF NOT EXISTS nvc_vocabulary_change_events (
  event_id    TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  concept_ids TEXT[] NOT NULL,
  to_version  TEXT NOT NULL,
  actor_id    TEXT,
  reason      TEXT,
  occurred_at TIMESTAMPTZ NOT NULL
);

-- 안전·운영
CREATE TABLE IF NOT EXISTS nvc_blocks (
  id         TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS nvc_interaction_events (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,   -- impression/viewed/interested/passed/introduction_*/meeting_*/outcome_*/blocked/reported
  actor_id    TEXT,
  subject_id  TEXT,
  rec_run_id  TEXT,
  payload     JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- 추천 실행·평가 재현성
CREATE TABLE IF NOT EXISTS nvc_recommendation_runs (
  id                 TEXT PRIMARY KEY,
  algorithm_version  TEXT NOT NULL,
  data_snapshot      TEXT,
  vocabulary_version TEXT,
  model_id           TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS nvc_recommendation_candidates (
  id           TEXT PRIMARY KEY,
  run_id       TEXT NOT NULL REFERENCES nvc_recommendation_runs(id),
  from_person  TEXT NOT NULL,
  to_person    TEXT NOT NULL,
  forward_score  NUMERIC,
  reverse_score  NUMERIC,
  common_score   NUMERIC,
  reciprocal     NUMERIC,
  combine_method TEXT,
  filter_codes   TEXT[],
  reason_codes   JSONB
);
CREATE TABLE IF NOT EXISTS nvc_pair_labels (
  id           TEXT PRIMARY KEY,
  from_person  TEXT NOT NULL,
  to_person    TEXT NOT NULL,
  a_gets_value SMALLINT CHECK (a_gets_value BETWEEN 0 AND 3),
  b_gets_value SMALLINT CHECK (b_gets_value BETWEEN 0 AND 3),
  feasibility  SMALLINT CHECK (feasibility BETWEEN 0 AND 3),
  labeler      TEXT NOT NULL,
  labeled_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 임베딩 (M2 모델 확정 후 차원 기입 — 그 전 실행 금지)
CREATE TABLE IF NOT EXISTS nvc_match_documents (
  id                    TEXT PRIMARY KEY,
  owner_person_id       TEXT NOT NULL,
  source_kind           TEXT NOT NULL,  -- need_query/offer_candidate/impact_context/experience_evidence/organization_context
  source_id             TEXT NOT NULL,
  direction             TEXT CHECK (direction IN ('query','candidate','context')),
  content               TEXT NOT NULL,  -- 사용자 승인·PII 제거 텍스트만
  consent_record_id     TEXT NOT NULL,
  source_revision       INTEGER NOT NULL,
  text_template_version TEXT NOT NULL,
  content_hash          TEXT NOT NULL
);
-- CREATE EXTENSION IF NOT EXISTS vector;  -- ⚠️ 승인 후
-- P2-3: 여러 space/model shadow 병행을 위해 복합 PK — 문서 하나가 KURE-v1·BGE-M3 등
-- 다중 임베딩 레코드를 가질 수 있다.
CREATE TABLE IF NOT EXISTS nvc_embedding_records (
  document_id      TEXT NOT NULL REFERENCES nvc_match_documents(id),
  space_id         TEXT NOT NULL,
  model_provider   TEXT NOT NULL,
  model_id         TEXT NOT NULL,
  dimensions       INTEGER NOT NULL,
  normalized       BOOLEAN DEFAULT TRUE,
  content_hash     TEXT NOT NULL,
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending','ready','failed','invalidated')),
  generated_at     TIMESTAMPTZ,
  -- embedding vector(1024),  -- ⚠️ 모델 확정(M2: KURE-v1 vs BGE-M3 shadow) 후 차원 기입
  PRIMARY KEY (document_id, space_id, model_id)
);

-- RLS 초안: nvc_need_intents·nvc_consent_records·nvc_interaction_events는
-- 본인(auth.uid())·service_role만 SELECT. 상세 정책은 M4 승인 시 작성.
