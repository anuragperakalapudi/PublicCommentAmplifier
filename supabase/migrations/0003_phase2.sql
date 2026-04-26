-- OpenComment Phase 2 schema additions: docket lifecycle tracking + email
-- send log (idempotency + 3-per-7-day cap enforcement). Idempotent.

-- Tracks dockets the user has engaged with (saved, commented). The cron
-- job that detects final-rule postings polls /v4/dockets/{id} for each
-- entry here and compares against last_seen_documents.
create table if not exists docket_watch (
  user_id text not null,
  docket_id text not null,
  last_seen_documents text[] not null default '{}',
  added_at timestamptz not null default now(),
  last_polled_at timestamptz,
  primary key (user_id, docket_id)
);

create index if not exists docket_watch_user_idx on docket_watch (user_id);

-- Records every email sent. Used for:
--   1. Idempotency — never send the same closing-soon-7d twice for one rule
--   2. Hard cap — block sends if >=3 in the trailing 7 days (unless daily digest)
--   3. Audit / unsubscribe trail
create table if not exists email_log (
  id bigserial primary key,
  user_id text not null,
  kind text not null,                              -- 'digest' | 'closing-soon-7d' | 'closing-soon-3d' | 'closing-soon-1d' | 'final-rule'
  document_id text,                                -- nullable for digest
  docket_id text,                                  -- nullable for non-docket sends
  resend_id text,                                  -- Resend's message id for trace
  sent_at timestamptz not null default now()
);

create index if not exists email_log_user_idx on email_log (user_id);
create index if not exists email_log_user_kind_doc_idx
  on email_log (user_id, kind, document_id);
create index if not exists email_log_user_sent_idx
  on email_log (user_id, sent_at);

-- Email preference additions (Phase 2 extras).
alter table email_preferences
  add column if not exists quiet_hours_start time;
alter table email_preferences
  add column if not exists quiet_hours_end time;
alter table email_preferences
  add column if not exists email_address text;

-- Stash the docket id alongside each cached regulation so final-rule
-- detection can resolve documentId → docketId without an extra API call
-- per saved/commented rule.
alter table regulation_cache
  add column if not exists docket_id text;
create index if not exists regulation_cache_docket_idx
  on regulation_cache (docket_id);
