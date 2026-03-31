-- ============================================================================
-- Nabu Cards — Complete Database Schema
-- Run in Supabase SQL Editor
-- ============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================================
-- PROFILES
-- ============================================================================

create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  avatar_url   text,
  native_language text not null default 'en',
  daily_goal   int not null default 20,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_profiles_email on profiles(email);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- DECKS
-- ============================================================================

create table if not exists decks (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  title           text not null,
  description     text,
  source_language text not null default 'en',
  target_language text not null,
  share_code      text unique,
  is_public       boolean not null default false,
  card_count      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_decks_owner on decks(owner_id);
create index idx_decks_share_code on decks(share_code) where share_code is not null;
create index idx_decks_public on decks(is_public) where is_public = true;

-- ============================================================================
-- CARDS
-- ============================================================================

create table if not exists cards (
  id                  uuid primary key default gen_random_uuid(),
  deck_id             uuid not null references decks(id) on delete cascade,
  word                text not null,
  translation         text not null,
  romanization        text,
  image_url           text,
  audio_url           text,
  example_sentence    text,
  example_translation text,
  explanation         text,
  part_of_speech      text,
  tags                text[] not null default '{}',
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_cards_deck on cards(deck_id);
create index idx_cards_deck_sort on cards(deck_id, sort_order);

-- Keep card_count in sync
create or replace function public.update_deck_card_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update decks set card_count = card_count + 1, updated_at = now()
    where id = NEW.deck_id;
  elsif TG_OP = 'DELETE' then
    update decks set card_count = card_count - 1, updated_at = now()
    where id = OLD.deck_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_update_card_count on cards;
create trigger trg_update_card_count
  after insert or delete on cards
  for each row execute function public.update_deck_card_count();

-- ============================================================================
-- CARD PROGRESS (SRS state per user per card)
-- ============================================================================

create table if not exists card_progress (
  id                  uuid primary key default gen_random_uuid(),
  card_id             uuid not null references cards(id) on delete cascade,
  user_id             uuid not null references profiles(id) on delete cascade,
  interval_days       int not null default 0,
  next_review_at      timestamptz not null default now(),
  consecutive_correct int not null default 0,
  total_reviews       int not null default 0,
  total_correct       int not null default 0,
  status              text not null default 'new'
                      check (status in ('new', 'learning', 'review', 'mastered')),
  last_reviewed_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique(card_id, user_id)
);

create index idx_progress_user on card_progress(user_id);
create index idx_progress_user_status on card_progress(user_id, status);
create index idx_progress_next_review on card_progress(user_id, next_review_at);

-- ============================================================================
-- REVIEW SESSIONS
-- ============================================================================

create table if not exists review_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  deck_id       uuid not null references decks(id) on delete cascade,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  cards_studied int not null default 0,
  cards_correct int not null default 0,
  duration_ms   int not null default 0
);

create index idx_sessions_user on review_sessions(user_id);
create index idx_sessions_user_deck on review_sessions(user_id, deck_id);
create index idx_sessions_started on review_sessions(user_id, started_at desc);

-- ============================================================================
-- DECK SUBSCRIPTIONS (users who have added a shared/public deck)
-- ============================================================================

create table if not exists deck_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  deck_id    uuid not null references decks(id) on delete cascade,
  created_at timestamptz not null default now(),

  unique(user_id, deck_id)
);

create index idx_subscriptions_user on deck_subscriptions(user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated
  before update on profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_decks_updated on decks;
create trigger trg_decks_updated
  before update on decks for each row execute function public.set_updated_at();

drop trigger if exists trg_cards_updated on cards;
create trigger trg_cards_updated
  before update on cards for each row execute function public.set_updated_at();

drop trigger if exists trg_progress_updated on card_progress;
create trigger trg_progress_updated
  before update on card_progress for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table decks enable row level security;
alter table cards enable row level security;
alter table card_progress enable row level security;
alter table review_sessions enable row level security;
alter table deck_subscriptions enable row level security;

-- PROFILES: users can read/update their own profile
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

-- DECKS: owners have full access, subscribers can read, anyone can read public
create policy "decks_select_own"
  on decks for select
  using (
    owner_id = auth.uid()
    or is_public = true
    or id in (select deck_id from deck_subscriptions where user_id = auth.uid())
  );

create policy "decks_insert_own"
  on decks for insert
  with check (owner_id = auth.uid());

create policy "decks_update_own"
  on decks for update
  using (owner_id = auth.uid());

create policy "decks_delete_own"
  on decks for delete
  using (owner_id = auth.uid());

-- CARDS: readable if user can see the deck, writable by deck owner
create policy "cards_select"
  on cards for select
  using (
    deck_id in (
      select id from decks where
        owner_id = auth.uid()
        or is_public = true
        or id in (select deck_id from deck_subscriptions where user_id = auth.uid())
    )
  );

create policy "cards_insert"
  on cards for insert
  with check (
    deck_id in (select id from decks where owner_id = auth.uid())
  );

create policy "cards_update"
  on cards for update
  using (
    deck_id in (select id from decks where owner_id = auth.uid())
  );

create policy "cards_delete"
  on cards for delete
  using (
    deck_id in (select id from decks where owner_id = auth.uid())
  );

-- CARD PROGRESS: users can only access their own progress
create policy "progress_select_own"
  on card_progress for select
  using (user_id = auth.uid());

create policy "progress_insert_own"
  on card_progress for insert
  with check (user_id = auth.uid());

create policy "progress_update_own"
  on card_progress for update
  using (user_id = auth.uid());

create policy "progress_delete_own"
  on card_progress for delete
  using (user_id = auth.uid());

-- REVIEW SESSIONS: users can only access their own sessions
create policy "sessions_select_own"
  on review_sessions for select
  using (user_id = auth.uid());

create policy "sessions_insert_own"
  on review_sessions for insert
  with check (user_id = auth.uid());

create policy "sessions_update_own"
  on review_sessions for update
  using (user_id = auth.uid());

-- DECK SUBSCRIPTIONS: users manage their own subscriptions
create policy "subscriptions_select_own"
  on deck_subscriptions for select
  using (user_id = auth.uid());

create policy "subscriptions_insert_own"
  on deck_subscriptions for insert
  with check (user_id = auth.uid());

create policy "subscriptions_delete_own"
  on deck_subscriptions for delete
  using (user_id = auth.uid());
