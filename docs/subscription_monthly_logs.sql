-- Migration: subscription_monthly_logs
-- Tracks which subscriptions were considered "taken" each month.
--
-- Note: subscription_id is TEXT (not UUID with FK) because subscriptions
-- are currently stored in localStorage with string IDs like "ab1", "ab-1714000000".
-- If a subscriptions table is added to Supabase later, convert to uuid + FK.
--
-- Run this in your Supabase SQL editor or via supabase db push.

create table if not exists subscription_monthly_logs (
  id             uuid         default gen_random_uuid() primary key,
  subscription_id text        not null,
  user_id        uuid         references auth.users(id) on delete cascade not null,
  month          varchar(7)   not null,   -- format: "2026-05"
  taken          boolean      default true not null,
  created_at     timestamptz  default now(),
  unique(subscription_id, user_id, month)
);

-- Row Level Security: each user can only see and modify their own logs
alter table subscription_monthly_logs enable row level security;

create policy "Users can manage their own logs"
  on subscription_monthly_logs
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast per-user per-month queries
create index on subscription_monthly_logs(user_id, month);
