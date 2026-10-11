-- Migration 009: Visit scheduling threads (meet-and-greet coordination)
--
-- One thread per (pet, adopter) coordinates questions, proposed slots, and
-- confirmation in a single conversation. Statuses mirror the adoption
-- application workflow style: open states first, terminal states last.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent (same convention as
-- migrations 001-008).

DO $$
BEGIN
  CREATE TYPE visit_thread_status AS ENUM (
    'requested',
    'proposed',
    'confirmed',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS visit_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  adopter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status visit_thread_status NOT NULL DEFAULT 'requested',
  preferred_slot TEXT NOT NULL DEFAULT '',
  confirmed_slot TEXT,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_visit_thread_pet_adopter UNIQUE (pet_id, adopter_id)
);

CREATE TABLE IF NOT EXISTS visit_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES visit_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visit_threads_pet ON visit_threads (pet_id);
CREATE INDEX IF NOT EXISTS idx_visit_threads_adopter ON visit_threads (adopter_id);
CREATE INDEX IF NOT EXISTS idx_visit_threads_status ON visit_threads (status);
CREATE INDEX IF NOT EXISTS idx_visit_messages_thread ON visit_messages (thread_id);
