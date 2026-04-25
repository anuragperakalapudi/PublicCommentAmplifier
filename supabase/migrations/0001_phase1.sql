-- OpenComment Phase 1 schema.
-- Run via the Supabase SQL editor or `supabase db push`.

create table if not exists profiles (
  user_id text primary key,
  age_range text,
  occupation text,
  state text,
  income_bracket text,
  household text,
  topics text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_regulations (
  user_id text not null,
  document_id text not null,
  saved_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create index if not exists saved_regulations_user_idx
  on saved_regulations (user_id);

create table if not exists commented_regulations (
  user_id text not null,
  document_id text not null,
  marked_at timestamptz not null default now(),
  comment_text text,
  source text not null default 'manual_paste',
  primary key (user_id, document_id)
);

create index if not exists commented_regulations_user_idx
  on commented_regulations (user_id);

create table if not exists regulation_cache (
  document_id text primary key,
  short_summary text,
  long_summary text,
  key_provisions text[],
  why_in_feed_template text,
  model_version text,
  generated_at timestamptz not null default now()
);

create table if not exists email_preferences (
  user_id text primary key,
  digest_frequency text not null default 'weekly',
  digest_time time not null default '09:00',
  timezone text not null default 'America/New_York',
  closing_soon_alerts boolean not null default true,
  final_rule_alerts boolean not null default true,
  muted_topics text[] not null default '{}',
  updated_at timestamptz not null default now()
);
