-- Migration 021: Add reason to visit requests
--
-- Adopters can specify why they want to visit the pet (meet-and-greet reason),
-- and shelter staff can review it alongside the preferred date.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent.

ALTER TABLE visit_threads
  ADD COLUMN IF NOT EXISTS reason TEXT;

