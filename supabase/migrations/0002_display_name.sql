-- Adds an optional display name to profiles. Used for the header avatar
-- initials. Idempotent.

alter table profiles add column if not exists display_name text;
