 -- ═══════════════════════════════════════════════════════════════
-- AlgoArena — full database schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation (available by default on Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(30) UNIQUE NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,          -- bcrypt hash
  elo_rating  INTEGER     NOT NULL DEFAULT 1200,
  wins        INTEGER     NOT NULL DEFAULT 0,
  losses      INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Fast lookup by email (login) and username (uniqueness check)
CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_elo      ON users (elo_rating DESC); -- leaderboard

-- ── 2. problems ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS problems (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(200) NOT NULL,
  description    TEXT         NOT NULL,
  topic          VARCHAR(50)  NOT NULL,          -- 'arrays', 'graphs', 'dp', etc.
  difficulty     VARCHAR(10)  NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  min_rating     INTEGER      NOT NULL DEFAULT 0,
  max_rating     INTEGER      NOT NULL DEFAULT 9999,
  sample_input   TEXT,
  sample_output  TEXT,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problems_topic      ON problems (topic);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems (difficulty);

-- ── 3. test_cases ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_cases (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id  UUID     NOT NULL REFERENCES problems (id) ON DELETE CASCADE,
  input       TEXT     NOT NULL,
  output      TEXT     NOT NULL,
  is_hidden   BOOLEAN  NOT NULL DEFAULT false   -- hidden = judge-only, visible = sample
);

CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON test_cases (problem_id);

-- ── 4. matches ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_one_id  UUID        NOT NULL REFERENCES users (id),
  player_two_id  UUID        NOT NULL REFERENCES users (id),
  problem_id     UUID                 REFERENCES problems (id),
  winner_id      UUID                 REFERENCES users (id),    -- NULL while active
  topic          VARCHAR(50),
  difficulty     VARCHAR(10),
  status         VARCHAR(20) NOT NULL DEFAULT 'active'          -- active | finished | cancelled
                 CHECK (status IN ('active', 'finished', 'cancelled')),
  started_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
  ended_at       TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matches_player_one ON matches (player_one_id);
CREATE INDEX IF NOT EXISTS idx_matches_player_two ON matches (player_two_id);
CREATE INDEX IF NOT EXISTS idx_matches_status     ON matches (status);

-- ── 5. submissions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID        NOT NULL REFERENCES matches (id),
  user_id      UUID        NOT NULL REFERENCES users (id),
  problem_id   UUID        NOT NULL REFERENCES problems (id),
  code         TEXT        NOT NULL,
  language     VARCHAR(20) NOT NULL DEFAULT 'javascript',
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'running', 'done')),
  verdict      VARCHAR(30)           -- ACCEPTED | WRONG_ANSWER | TIME_LIMIT_EXCEEDED | RUNTIME_ERROR
               CHECK (verdict IN ('ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', NULL)),
  runtime_ms   INTEGER,
  memory_kb    INTEGER,
  submitted_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_match   ON submissions (match_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user    ON submissions (user_id);

-- ── 6. elo_history ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS elo_history (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID      NOT NULL REFERENCES users (id),
  match_id    UUID      NOT NULL REFERENCES matches (id),
  old_rating  INTEGER   NOT NULL,
  new_rating  INTEGER   NOT NULL,
  delta       INTEGER   NOT NULL,      -- positive = win, negative = loss
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elo_history_user ON elo_history (user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- Verify tables were created
-- ═══════════════════════════════════════════════════════════════
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
