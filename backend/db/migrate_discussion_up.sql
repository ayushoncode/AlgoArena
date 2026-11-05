-- migrate_discussion_up.sql
-- Additive migration for AlgoArena Discussion Rooms feature
-- Creates discussion_rooms, discussion_threads, discussion_replies,
-- discussion_votes, discussion_reports, discussion_blocks, discussion_suspensions.
-- Zero changes to existing tables or columns. No IP addresses stored.

CREATE TABLE IF NOT EXISTS discussion_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL UNIQUE REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  thread_count INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussion_rooms_problem ON discussion_rooms(problem_id);
CREATE INDEX IF NOT EXISTS idx_discussion_rooms_activity ON discussion_rooms(last_activity_at DESC);

CREATE TABLE IF NOT EXISTS discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES discussion_rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Question', 'Approach', 'Hint', 'Solution')),
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  helpful_count INT NOT NULL DEFAULT 0,
  reply_count INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))) STORED
);

CREATE INDEX IF NOT EXISTS idx_discussion_threads_room_status_created ON discussion_threads(room_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_room_helpful ON discussion_threads(room_id, helpful_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_author ON discussion_threads(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_tsv ON discussion_threads USING GIN(tsv);

CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  reply_to_id UUID REFERENCES discussion_replies(id) ON DELETE SET NULL,
  helpful_count INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_thread_status ON discussion_replies(thread_id, status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author ON discussion_replies(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS discussion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_kind VARCHAR(10) NOT NULL CHECK (post_kind IN ('thread', 'reply')),
  post_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_discussion_votes UNIQUE (user_id, post_kind, post_id)
);

CREATE INDEX IF NOT EXISTS idx_discussion_votes_lookup ON discussion_votes(user_id, post_kind, post_id);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_post ON discussion_votes(post_kind, post_id);

CREATE TABLE IF NOT EXISTS discussion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_kind VARCHAR(10) NOT NULL CHECK (post_kind IN ('thread', 'reply')),
  post_id UUID NOT NULL,
  category VARCHAR(50) NOT NULL,
  note VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_discussion_reports UNIQUE (reporter_id, post_kind, post_id)
);

CREATE INDEX IF NOT EXISTS idx_discussion_reports_post ON discussion_reports(post_kind, post_id, status);
CREATE INDEX IF NOT EXISTS idx_discussion_reports_reporter ON discussion_reports(reporter_id);

CREATE TABLE IF NOT EXISTS discussion_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_discussion_blocks UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_discussion_blocks_lookup ON discussion_blocks(blocker_id, blocked_id);

CREATE TABLE IF NOT EXISTS discussion_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  suspended_until TIMESTAMPTZ NOT NULL,
  created_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussion_suspensions_user ON discussion_suspensions(user_id, suspended_until);

