-- ============================================================================
-- backend/db/migrate_social_up.sql
-- Additive migration for AlgoArena Friends & Notification Centre
-- Adds 4 new isolated tables: friendships, friend_blocks, social_settings, notifications.
-- ============================================================================

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 days'),
  CONSTRAINT chk_user_pair CHECK (user_low < user_high),
  CONSTRAINT uq_friendships_pair UNIQUE (user_low, user_high)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_low_status ON friendships(user_low, status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_high_status ON friendships(user_high, status);
CREATE INDEX IF NOT EXISTS idx_friendships_requested_by_status ON friendships(requested_by, status);
CREATE INDEX IF NOT EXISTS idx_friendships_status_expires ON friendships(status, expires_at);

CREATE TABLE IF NOT EXISTS friend_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_friend_blocks UNIQUE (blocker_id, blocked_id),
  CONSTRAINT chk_friend_no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_blocks_lookup ON friend_blocks(blocker_id, blocked_id);

CREATE TABLE IF NOT EXISTS social_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  allow_requests VARCHAR(20) NOT NULL DEFAULT 'everyone' CHECK (allow_requests IN ('everyone', 'nobody')),
  friends_visibility VARCHAR(20) NOT NULL DEFAULT 'signed_in' CHECK (friends_visibility IN ('signed_in', 'friends_only', 'only_me')),
  muted_types TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read_at, created_at DESC);
