-- OpenComment Phase 3 semantic matching and personalized why-cache.
-- Idempotent. Requires Supabase's pgvector extension.

create extension if not exists vector;

alter table regulation_cache
  add column if not exists embedding vector(768);
alter table regulation_cache
  add column if not exists embedding_model text;
alter table regulation_cache
  add column if not exists embedding_hash text;
alter table regulation_cache
  add column if not exists embedding_generated_at timestamptz;

alter table profiles
  add column if not exists profile_embedding vector(768);
alter table profiles
  add column if not exists profile_embedding_model text;
alter table profiles
  add column if not exists profile_embedding_hash text;
alter table profiles
  add column if not exists profile_embedding_generated_at timestamptz;

create table if not exists why_in_feed_cache (
  user_id text not null,
  document_id text not null,
  text text not null,
  flags text[] not null default '{}',
  context_hash text not null,
  model_version text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create index if not exists why_in_feed_cache_user_idx
  on why_in_feed_cache (user_id);
