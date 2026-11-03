-- migrate_voice_up.sql
-- Additive migration for AlgoArena Live Voice feature
-- Creates voice_sessions, voice_blocks, voice_reports, voice_usage_daily, voice_suspensions.
-- Zero changes to existing tables or columns. No audio, IP, or device names stored.

CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_one_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player_two_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_room_id_hash VARCHAR(64) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  end_reason VARCHAR(50),
  duration_seconds INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_match_id ON voice_sessions(match_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_players ON voice_sessions(player_one_id, player_two_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_room_hash ON voice_sessions(provider_room_id_hash);

CREATE TABLE IF NOT EXISTS voice_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_voice_blocks_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_blocks_lookup ON voice_blocks(blocker_id, blocked_id);

CREATE TABLE IF NOT EXISTS voice_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  category VARCHAR(50) NOT NULL,
  note VARCHAR(500),
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_reports_reported ON voice_reports(reported_id, status);

CREATE TABLE IF NOT EXISTS voice_usage_daily (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  seconds INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_voice_usage_date ON voice_usage_daily(usage_date);

CREATE TABLE IF NOT EXISTS voice_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  suspended_until TIMESTAMPTZ NOT NULL,
  created_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_suspensions_active ON voice_suspensions(user_id, suspended_until);
