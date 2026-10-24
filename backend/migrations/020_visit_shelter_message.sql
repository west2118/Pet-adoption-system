-- Migration 020: Message attached to a shelter's visit confirmation
--
-- The shelter confirms a meet-and-greet by emailing the adopter a visit date
-- and a short message. Keeping the message on the request means the read-only
-- visit view can show exactly what was sent.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent (same convention as
-- migrations 001-019).

ALTER TABLE visit_threads
  ADD COLUMN IF NOT EXISTS shelter_message TEXT;
