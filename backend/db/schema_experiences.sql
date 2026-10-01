-- ═══════════════════════════════════════════════════════════════
-- AlgoArena — Interview Experiences (Intel Reports) Schema
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. interview_experiences ──────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_experiences (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_anonymous        BOOLEAN      NOT NULL DEFAULT false,
  track               VARCHAR(10)  NOT NULL CHECK (track IN ('intern', 'sde')),
  company             VARCHAR(60)  NOT NULL,
  company_normalized  VARCHAR(60)  NOT NULL,
  role_title          VARCHAR(100) NOT NULL,
  location            VARCHAR(100),
  year                INTEGER      NOT NULL,
  month               INTEGER      CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
  source              VARCHAR(30)  CHECK (source IN ('on_campus', 'off_campus', 'referral', NULL)),
  stipend_range       VARCHAR(50),
  experience_years    NUMERIC(3,1),
  ctc_range           VARCHAR(50),
  difficulty          VARCHAR(10)  NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  outcome             VARCHAR(20)  NOT NULL CHECK (outcome IN ('selected', 'rejected', 'waiting', 'withdrew')),
  rounds              JSONB        NOT NULL DEFAULT '[]'::jsonb,
  overall_experience  TEXT         NOT NULL,
  tips                TEXT,
  prep_resources      TEXT,
  helpful_count       INTEGER      NOT NULL DEFAULT 0,
  bookmark_count      INTEGER      NOT NULL DEFAULT 0,
  report_count        INTEGER      NOT NULL DEFAULT 0,
  status              VARCHAR(20)  NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_exp_track         ON interview_experiences (track);
CREATE INDEX IF NOT EXISTS idx_exp_company_norm  ON interview_experiences (company_normalized);
CREATE INDEX IF NOT EXISTS idx_exp_year          ON interview_experiences (year DESC);
CREATE INDEX IF NOT EXISTS idx_exp_outcome       ON interview_experiences (outcome);
CREATE INDEX IF NOT EXISTS idx_exp_difficulty    ON interview_experiences (difficulty);
CREATE INDEX IF NOT EXISTS idx_exp_status        ON interview_experiences (status);
CREATE INDEX IF NOT EXISTS idx_exp_created_at    ON interview_experiences (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_helpful_count ON interview_experiences (helpful_count DESC);
CREATE INDEX IF NOT EXISTS idx_exp_author        ON interview_experiences (author_id);

-- ── 2. experience_helpful ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_helpful (
  experience_id UUID      NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,
  user_id       UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (experience_id, user_id)
);

-- ── 3. experience_bookmarks ────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_bookmarks (
  experience_id UUID      NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,
  user_id       UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (experience_id, user_id)
);

-- ── 4. experience_reports ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_reports (
  experience_id UUID      NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,
  user_id       UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason        VARCHAR(255),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (experience_id, user_id)
);
