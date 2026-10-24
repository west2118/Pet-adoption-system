-- Migration 013: visits are single requests, not conversation threads.
--
-- Visit coordination now happens over email: an adopter submits one request
-- per pet, the shelter approves or declines it from the dashboard, and the
-- adopter is emailed the decision. `visit_threads` keeps the request row and
-- its status; `visit_messages` is gone so a visit can never grow unbounded
-- conversation data.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent (same convention as
-- migrations 001-012).

DROP TABLE IF EXISTS visit_messages;

-- Legacy threads used a "proposed" step that only made sense with a
-- conversation. They become fresh requests again, preserving the one-row-per
-- (pet, adopter) rule.
UPDATE visit_threads SET status = 'requested' WHERE status = 'proposed';
