-- ============================================================================
-- Design Blend v2 — Complete Supabase Postgres Schema, RLS & RPC Migration
-- Engine Contract: taste-engine-2.0.0 | Catalog Contract: v2.0.0
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. CATALOG PLATES ----------------------------------------------------------
create table if not exists public.plates (
  id text primary key,
  style_id text not null,
  category_id text not null,
  field_id text not null,
  label text not null,
  subtitle text not null default '',
  visual_character text not null default '',
  canonical_ref text not null default '',
  image_url text,
  specimen_recipe jsonb not null default '{}'::jsonb,
  credit_line text not null,
  source_url text,
  license_note text not null default 'Credited reference per CREDITS.md',
  alt_text text not null,
  pair_group_id text,
  craft_dimension text, -- null | 'density' | 'typography' | 'chromatic' | 'surface'
  craft_pole numeric,   -- 0..100 when part of a controlled 4-state craft strip
  diagnostic_kind text not null default 'canonical', -- 'canonical' | 'foil' | 'craft_variant' | 'anti_slop'
  axis_loadings jsonb not null default '{}'::jsonb,
  craft_loadings jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  status text not null default 'approved' check (status in ('pending', 'approved', 'retired')),
  catalog_version text not null default 'v2.0.0',
  created_at timestamptz not null default now()
);

create index if not exists plates_field_idx on public.plates (field_id);
create index if not exists plates_category_idx on public.plates (category_id);
create index if not exists plates_pair_group_idx on public.plates (pair_group_id) where pair_group_id is not null;
create index if not exists plates_status_idx on public.plates (status);

-- 2. CAPTURE SESSIONS --------------------------------------------------------
create table if not exists public.capture_sessions (
  id text primary key default ('cap_' || encode(gen_random_bytes(10), 'hex')),
  user_id uuid references auth.users(id) on delete set null,
  selected_fields text[] not null default '{}',
  selected_categories text[] not null default '{}',
  intent text not null default 'quick_read', -- 'quick_read' | 'deep_dive' | 'evolve'
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists capture_sessions_user_idx on public.capture_sessions (user_id);

-- 3. PLATE RESPONSES (APPEND-ONLY) -------------------------------------------
create table if not exists public.plate_responses (
  id text primary key default ('sig_' || encode(gen_random_bytes(10), 'hex')),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null references public.capture_sessions(id) on delete cascade,
  plate_id text not null references public.plates(id),
  mode text not null check (mode in ('rate', 'pair', 'rank', 'pick')),
  value integer not null check (value >= 0 and value <= 100),
  critique_tags text[] not null default '{}',
  note text,
  sequence integer not null check (sequence >= 0),
  created_at timestamptz not null default now()
);

create index if not exists plate_responses_user_seq_idx on public.plate_responses (user_id, sequence desc);
create index if not exists plate_responses_session_idx on public.plate_responses (session_id);
create index if not exists plate_responses_plate_idx on public.plate_responses (plate_id);

-- Enforce append-only immutability on plate_responses
create or replace function public.prevent_signal_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'plate_responses is append-only; insert a newer sequence instead of mutating history.';
end;
$$;

drop trigger if exists trg_plate_responses_immutable on public.plate_responses;
create trigger trg_plate_responses_immutable
  before update on public.plate_responses
  for each row execute function public.prevent_signal_mutation();

-- 4. USER NORTH-STAR REFERENCE ANCHORS ---------------------------------------
create table if not exists public.user_reference_anchors (
  id text primary key default ('anc_' || encode(gen_random_bytes(8), 'hex')),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  creator_credit text not null default '',
  source_url text not null,
  image_url text,
  field_id text not null default 'ui-ux',
  why_note text not null default '',
  relationship text not null default 'north_star' check (relationship in ('north_star', 'made_by_me', 'influence', 'anti_anchor')),
  created_at timestamptz not null default now()
);

create index if not exists user_reference_anchors_user_idx on public.user_reference_anchors (user_id);

-- 5. PROFILES & IMMUTABLE PROFILE VERSIONS -----------------------------------
create table if not exists public.profiles (
  id text primary key default ('prf_' || encode(gen_random_bytes(8), 'hex')),
  user_id uuid unique references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9_-]{1,30}$'),
  display_name text not null default '',
  discipline_line text not null default '',
  is_public boolean not null default true,
  current_version_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_versions (
  id text primary key default ('pv_' || encode(gen_random_bytes(8), 'hex')),
  profile_id text not null references public.profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  version integer not null check (version >= 1),
  axes jsonb not null,
  axis_coverage jsonb not null,
  overall_coverage numeric not null default 0,
  craft_profile jsonb not null default '{}'::jsonb,
  field_slices jsonb not null default '{}'::jsonb,
  category_affinity jsonb not null default '{}'::jsonb,
  style_vector jsonb not null default '{}'::jsonb,
  top_plates jsonb not null default '[]'::jsonb,
  negative_anchors jsonb not null default '[]'::jsonb,
  critique_signature jsonb not null default '{}'::jsonb,
  creative_range jsonb not null default '{}'::jsonb,
  archetype jsonb not null,
  rated_count integer not null default 0,
  model_version text not null default 'taste-engine-2.0.0',
  catalog_version text not null default 'v2.0.0',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (profile_id, version)
);

-- 6. BLENDS & INVITES --------------------------------------------------------
create table if not exists public.blend_invites (
  token text primary key default encode(gen_random_bytes(12), 'hex'),
  inviter_profile_id text not null references public.profiles(id) on delete cascade,
  context_field text, -- null = all overlapping fields
  accepted_by_profile_id text references public.profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.blends (
  id text primary key default ('bld_' || encode(gen_random_bytes(8), 'hex')),
  profile_a_id text not null references public.profiles(id) on delete cascade,
  profile_b_id text not null references public.profiles(id) on delete cascade,
  version_a integer not null,
  version_b integer not null,
  score integer not null,
  harmony_score integer not null,
  friction_score integer not null,
  dyad_archetype jsonb not null,
  dealbreaker_clashes jsonb not null default '[]'::jsonb,
  per_axis jsonb not null default '[]'::jsonb,
  per_field jsonb not null default '[]'::jsonb,
  shared_plates jsonb not null default '[]'::jsonb,
  divergent_plates jsonb not null default '[]'::jsonb,
  crossover_bridges jsonb not null default '[]'::jsonb,
  model_version text not null default 'taste-engine-2.0.0',
  computed_at timestamptz not null default now()
);

create index if not exists blends_pair_idx on public.blends (profile_a_id, profile_b_id);

-- 7. ROW LEVEL SECURITY (RLS) ------------------------------------------------
alter table public.plates enable row level security;
alter table public.capture_sessions enable row level security;
alter table public.plate_responses enable row level security;
alter table public.user_reference_anchors enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_versions enable row level security;
alter table public.blend_invites enable row level security;
alter table public.blends enable row level security;

-- Catalog plates are publicly readable (non-retired)
create policy "plates_public_read" on public.plates
  for select using (status <> 'retired');

-- Sessions & signals belong to auth.uid()
create policy "sessions_owner_all" on public.capture_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "responses_owner_insert" on public.plate_responses
  for insert with check (auth.uid() = user_id);

create policy "responses_public_or_owner_read" on public.plate_responses
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = plate_responses.user_id and p.is_public = true
    )
  );

create policy "anchors_public_or_owner_read" on public.user_reference_anchors
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.user_id = user_reference_anchors.user_id and p.is_public = true
    )
  );

create policy "anchors_owner_write" on public.user_reference_anchors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Profiles & published versions
create policy "profiles_public_or_owner_select" on public.profiles
  for select using (is_public = true or auth.uid() = user_id);

create policy "profiles_owner_write" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profile_versions_public_or_owner_select" on public.profile_versions
  for select using (
    auth.uid() = user_id
    or (
      is_published = true
      and exists (
        select 1 from public.profiles p
        where p.id = profile_versions.profile_id and p.is_public = true
      )
    )
  );

create policy "profile_versions_owner_insert" on public.profile_versions
  for insert with check (auth.uid() = user_id);

-- Invites & Blends
create policy "invites_public_read" on public.blend_invites
  for select using (expires_at > now());

create policy "invites_owner_insert" on public.blend_invites
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = inviter_profile_id and p.user_id = auth.uid()
    )
  );

create policy "blends_public_read" on public.blends
  for select using (
    exists (select 1 from public.profiles pa where pa.id = profile_a_id and (pa.is_public = true or pa.user_id = auth.uid()))
    and exists (select 1 from public.profiles pb where pb.id = profile_b_id and (pb.is_public = true or pb.user_id = auth.uid()))
  );

create policy "blends_authenticated_insert" on public.blends
  for insert with check (auth.role() in ('authenticated', 'anon'));
