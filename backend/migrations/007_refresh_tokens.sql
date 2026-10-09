-- Migration 007: Server-side refresh token sessions
--
-- Access tokens stay short-lived JWTs; refresh tokens are opaque random
-- strings whose SHA-256 hash lives here. Only the hash is stored, so a
-- database leak alone cannot mint sessions. Rotation deletes the used row.

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at);
