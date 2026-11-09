-- ============================================================================
-- backend/db/migrate_social_down.sql
-- Rollback migration for AlgoArena Friends & Notification Centre
-- Drops the 4 additive tables.
-- ============================================================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS social_settings CASCADE;
DROP TABLE IF EXISTS friend_blocks CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
