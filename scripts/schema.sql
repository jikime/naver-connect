-- ============================================================
-- naver-connect 협업관계 Supabase 스키마 v1.0
-- 실행: Supabase SQL Editor 또는 npx tsx scripts/seed-supabase.ts (자동 실행)
-- ============================================================

-- 기관 테이블 (기존 JSON 시드 + 공공 사회적기업 공공데이터 수용)
CREATE TABLE IF NOT EXISTS organizations (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  region               JSONB,
  field_tags           INTEGER[],
  value_chain_stage_id INTEGER,
  actor_type           TEXT,
  ai_confidence        NUMERIC(4,2),
  source               TEXT,
  verified_by          TEXT[],
  last_checked_at      DATE,
  member_id            TEXT,
  buying_power         INTEGER,
  five_force_role      TEXT,
  subgroup_code        TEXT,
  -- 공공 사회적기업 확장 필드
  org_registration_no  TEXT UNIQUE,
  certification_type   TEXT,
  address              TEXT,
  employees_count      INTEGER,
  is_public_data       BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 하위그룹 매핑 (org_id → 14개 SubgroupCode)
CREATE TABLE IF NOT EXISTS subgroup_map (
  org_id          TEXT PRIMARY KEY,
  subgroup_code   TEXT NOT NULL,
  subgroup_label  TEXT,
  kind            TEXT,
  rationale       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 협업 사례
CREATE TABLE IF NOT EXISTS collab_cases (
  id                   TEXT PRIMARY KEY,
  title                TEXT NOT NULL,
  status               TEXT,
  participant_org_ids  TEXT[],
  period               TEXT,
  outcome_summary      TEXT,
  field_tags           INTEGER[],
  input_by             TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 협업 관계 그래프 엣지
CREATE TABLE IF NOT EXISTS collab_relations (
  id               TEXT PRIMARY KEY,
  org_a_id         TEXT NOT NULL,
  org_b_id         TEXT NOT NULL,
  org_a_subgroup   TEXT,
  org_b_subgroup   TEXT,
  pair_code        TEXT,
  relation_type    TEXT,
  domain_tags      INTEGER[],
  strength         NUMERIC(4,2),
  basis_case_id    TEXT,
  is_actual        BOOLEAN DEFAULT TRUE,
  description      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 제안 (세션 기반 write → DB 영속화 확장용)
CREATE TABLE IF NOT EXISTS project_proposals (
  id                     TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  basis_type             TEXT,
  basis_ref              TEXT,
  participant_member_ids TEXT[],
  expected_effect        TEXT,
  track_status           TEXT DEFAULT '제안됨',
  has_policy_program     BOOLEAN DEFAULT FALSE,
  linked_deal_id         TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_organizations_updated_at') THEN
    CREATE TRIGGER trg_organizations_updated_at
      BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_proposals_updated_at') THEN
    CREATE TRIGGER trg_proposals_updated_at
      BEFORE UPDATE ON project_proposals
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END;
$$;
