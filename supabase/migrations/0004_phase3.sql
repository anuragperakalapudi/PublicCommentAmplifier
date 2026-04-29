-- OpenComment Phase 3 schema additions: free-text profile context,
-- multi-state interest, story bank, ranking feedback. Idempotent.

-- Profile additions for richer ranking + comment-drafting context.
alter table profiles
  add column if not exists free_text_context text;
alter table profiles
  add column if not exists additional_states text[] not null default '{}';

-- Story bank: short personal stories the LLM cites when drafting comments
-- on related rules. Tags drawn from the closed Topic enum drive selection.
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stories_user_idx on stories (user_id);

-- Per-user thumbs feedback. Used by the ranker to nudge sort order; never
-- removes rules from view. Primary key is (user_id, document_id) so
-- toggling a signal upserts cleanly.
create table if not exists ranking_feedback (
  user_id text not null,
  document_id text not null,
  signal text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create index if not exists ranking_feedback_user_idx
  on ranking_feedback (user_id);
