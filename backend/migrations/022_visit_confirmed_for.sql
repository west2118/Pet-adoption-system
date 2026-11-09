-- 022: Structured confirmed visit date
--
-- The shelter dashboard charts confirmed meet-and-greets by day. The
-- human-readable slot stays in confirmed_slot (for emails and visit cards);
-- this column stores the wall-clock date/time so the chart can group reliably.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent.

ALTER TABLE visit_threads
  ADD COLUMN IF NOT EXISTS confirmed_for TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_visit_threads_confirmed_for
  ON visit_threads (confirmed_for)
  WHERE status = 'confirmed';
