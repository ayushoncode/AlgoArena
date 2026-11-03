-- migrate_voice_down.sql
-- Rollback for Live Voice additive tables

DROP TABLE IF EXISTS voice_suspensions CASCADE;
DROP TABLE IF EXISTS voice_usage_daily CASCADE;
DROP TABLE IF EXISTS voice_reports CASCADE;
DROP TABLE IF EXISTS voice_blocks CASCADE;
DROP TABLE IF EXISTS voice_sessions CASCADE;

