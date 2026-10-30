-- migrate_premium_down.sql
-- Down migration for AlgoArena Premium Plan
-- Safely drops added tables in reverse order

DROP TABLE IF EXISTS launch_slots CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

