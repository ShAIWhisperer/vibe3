-- VIBE3 Database Schema
-- Run this in Supabase SQL Editor to set up all tables and policies

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Anonymous'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Anyone can read profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- SESSIONS
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  data jsonb not null,
  drum_data jsonb,
  is_public boolean default false,
  play_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_slug on public.sessions(slug);
create index if not exists idx_sessions_public on public.sessions(is_public) where is_public = true;

-- RLS
alter table public.sessions enable row level security;

create policy "Users can CRUD own sessions"
  on public.sessions for all using (auth.uid() = user_id);

create policy "Anyone can read public sessions"
  on public.sessions for select using (is_public = true);

-- ============================================================
-- COMMUNITY PATTERNS
-- ============================================================
create table if not exists public.community_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  style text,
  tags text[] default '{}',
  tempo integer not null,
  steps jsonb not null,
  module_type text default 'bass',
  likes integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_community_patterns_user on public.community_patterns(user_id);
create index if not exists idx_community_patterns_likes on public.community_patterns(likes desc);

-- RLS
alter table public.community_patterns enable row level security;

create policy "Anyone can read community patterns"
  on public.community_patterns for select using (true);

create policy "Users can insert own patterns"
  on public.community_patterns for insert with check (auth.uid() = user_id);

create policy "Users can update own patterns"
  on public.community_patterns for update using (auth.uid() = user_id);

create policy "Users can delete own patterns"
  on public.community_patterns for delete using (auth.uid() = user_id);

-- ============================================================
-- PATTERN LIKES
-- ============================================================
create table if not exists public.pattern_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  pattern_id uuid not null references public.community_patterns(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, pattern_id)
);

-- RLS
alter table public.pattern_likes enable row level security;

create policy "Anyone can read likes"
  on public.pattern_likes for select using (true);

create policy "Users can insert own likes"
  on public.pattern_likes for insert with check (auth.uid() = user_id);

create policy "Users can delete own likes"
  on public.pattern_likes for delete using (auth.uid() = user_id);

-- Function to increment/decrement like count
create or replace function public.handle_pattern_like()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.community_patterns set likes = likes + 1 where id = new.pattern_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.community_patterns set likes = likes - 1 where id = old.pattern_id;
    return old;
  end if;
end;
$$ language plpgsql security definer;

drop trigger if exists on_pattern_like on public.pattern_likes;
create trigger on_pattern_like
  after insert or delete on public.pattern_likes
  for each row execute function public.handle_pattern_like();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public)
values ('exports', 'exports', true)
on conflict (id) do nothing;
