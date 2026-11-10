-- 023: deny-by-default for Supabase's Data API (PostgREST).
--
-- The Express API is the only client of this database and connects as the
-- `postgres` role (the table owner), which bypasses RLS. Supabase's publishable
-- ("anon") key must never read these tables directly: without this, anyone
-- holding the public key could select users, password hashes and refresh tokens.
--
-- With RLS enabled and no policies, anon/authenticated requests see zero rows.
--
-- The loop covers tables added by future migrations too, because this file
-- re-runs on every migration pass (there is no tracking table). Do not add
-- FORCE ROW LEVEL SECURITY — it would apply to the owning API role as well.

DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target.tablename);
  END LOOP;
END $$;
