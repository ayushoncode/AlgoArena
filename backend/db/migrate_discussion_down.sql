-- migrate_discussion_down.sql
-- Rollback for AlgoArena Discussion Rooms feature
-- Drops all discussion tables in reverse dependency order.

DROP TABLE IF EXISTS discussion_suspensions CASCADE;
DROP TABLE IF EXISTS discussion_blocks CASCADE;
DROP TABLE IF EXISTS discussion_reports CASCADE;
DROP TABLE IF EXISTS discussion_votes CASCADE;
DROP TABLE IF EXISTS discussion_replies CASCADE;
DROP TABLE IF EXISTS discussion_threads CASCADE;
DROP TABLE IF EXISTS discussion_rooms CASCADE;

