-- Proimagem.pt — schema inicial CMS (Supabase)
-- Aplicar via: supabase db push / SQL Editor / `psql`

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.section_type as enum ('home', 'gallery', 'team', 'partners');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.media_type as enum ('image', 'video');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.media_slot as enum ('gallery', 'hero', 'home_stack');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.partner_tier as enum ('main', 'secondary');
exception when duplicate_object then null;
end $$;

-- Admin profiles (autorização além de auth.users)
create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Site config (singleton)
create table if not exists public.site_config (
  id int primary key default 1 check (id = 1),
  brand text not null default 'Proimagem.pt',
  email text,
  socials jsonb not null default '{}'::jsonb,
  nav jsonb not null default '[]'::jsonb,
  hero jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Sections (home / galleries / team / partners containers)
create table if not exists public.sections (
  id text primary key,
  type public.section_type not null,
  title text not null,
  layout text,
  note text,
  page_path text,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Media items
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  section_id text not null references public.sections (id) on delete cascade,
  slot public.media_slot not null default 'gallery',
  type public.media_type not null,
  storage_path text,
  legacy_url text,
  thumbnail_path text,
  thumbnail_legacy_url text,
  title text,
  alt_text text,
  featured boolean not null default false,
  width int,
  height int,
  duration_seconds numeric,
  file_size bigint,
  mime_type text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_items_has_source check (
    storage_path is not null or legacy_url is not null
  )
);

-- Team
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roles text not null default '',
  photo_path text,
  photo_legacy_url text,
  photo_position text,
  skills text[] not null default '{}',
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partners
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text,
  logo_legacy_url text,
  tier public.partner_tier not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists media_items_section_slot_sort_idx
  on public.media_items (section_id, slot, sort_order);

create index if not exists media_items_storage_path_idx
  on public.media_items (storage_path)
  where storage_path is not null;

create index if not exists team_members_featured_sort_idx
  on public.team_members (is_featured, sort_order);

create index if not exists partners_tier_sort_idx
  on public.partners (tier, sort_order);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sections_set_updated_at on public.sections;
create trigger sections_set_updated_at
  before update on public.sections
  for each row execute function public.set_updated_at();

drop trigger if exists media_items_set_updated_at on public.media_items;
create trigger media_items_set_updated_at
  before update on public.media_items
  for each row execute function public.set_updated_at();

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

drop trigger if exists partners_set_updated_at on public.partners;
create trigger partners_set_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

drop trigger if exists site_config_set_updated_at on public.site_config;
create trigger site_config_set_updated_at
  before update on public.site_config
  for each row execute function public.set_updated_at();

-- is_admin() helper
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- RLS
alter table public.admin_profiles enable row level security;
alter table public.site_config enable row level security;
alter table public.sections enable row level security;
alter table public.media_items enable row level security;
alter table public.team_members enable row level security;
alter table public.partners enable row level security;

-- admin_profiles
drop policy if exists "admin_profiles_select_own_or_admin" on public.admin_profiles;
create policy "admin_profiles_select_own_or_admin"
  on public.admin_profiles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin_profiles_admin_all" on public.admin_profiles;
create policy "admin_profiles_admin_all"
  on public.admin_profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- site_config: public read, admin write
drop policy if exists "site_config_public_read" on public.site_config;
create policy "site_config_public_read"
  on public.site_config for select
  to anon, authenticated
  using (true);

drop policy if exists "site_config_admin_write" on public.site_config;
create policy "site_config_admin_write"
  on public.site_config for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- sections
drop policy if exists "sections_public_read_published" on public.sections;
create policy "sections_public_read_published"
  on public.sections for select
  to anon, authenticated
  using (published = true or public.is_admin());

drop policy if exists "sections_admin_write" on public.sections;
create policy "sections_admin_write"
  on public.sections for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- media_items
drop policy if exists "media_items_public_read" on public.media_items;
create policy "media_items_public_read"
  on public.media_items for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.sections s
      where s.id = media_items.section_id and s.published = true
    )
  );

drop policy if exists "media_items_admin_write" on public.media_items;
create policy "media_items_admin_write"
  on public.media_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- team_members
drop policy if exists "team_members_public_read" on public.team_members;
create policy "team_members_public_read"
  on public.team_members for select
  to anon, authenticated
  using (true);

drop policy if exists "team_members_admin_write" on public.team_members;
create policy "team_members_admin_write"
  on public.team_members for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- partners
drop policy if exists "partners_public_read" on public.partners;
create policy "partners_public_read"
  on public.partners for select
  to anon, authenticated
  using (true);

drop policy if exists "partners_admin_write" on public.partners;
create policy "partners_admin_write"
  on public.partners for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed sections (idempotent)
insert into public.sections (id, type, title, layout, page_path, sort_order) values
  ('home', 'home', 'Página Inicial', null, '/', 0),
  ('studio-space', 'gallery', 'Studio Space', 'studio', '/studio-space', 10),
  ('multicam', 'gallery', 'Multicam', 'multicam', '/multicam', 20),
  ('aftermovie', 'gallery', 'Aftermovie', 'reels', '/aftermovie', 30),
  ('photography', 'gallery', 'Photography', 'default', '/photography', 40),
  ('fpv-drone', 'gallery', 'FPV/Drone', 'default', '/fpv-drone', 50),
  ('social-media', 'gallery', 'Social Media', 'default', '/social-media', 60),
  ('team', 'team', 'Meet the Team', null, '/team', 70),
  ('partners', 'partners', 'Parceiros', null, '/team#parceiros', 80)
on conflict (id) do update set
  title = excluded.title,
  layout = excluded.layout,
  page_path = excluded.page_path,
  sort_order = excluded.sort_order;

insert into public.site_config (id, brand, email, socials, nav, hero)
values (
  1,
  'Proimagem.pt',
  'hello@proimagem.pt',
  '{"instagram":"","vimeo":"","youtube":""}'::jsonb,
  '[
    {"label":"Home","href":"/"},
    {"label":"Studio Space","href":"/studio-space"},
    {"label":"Multicam","href":"/multicam"},
    {"label":"Aftermovie","href":"/aftermovie"},
    {"label":"Photography","href":"/photography"},
    {"label":"FPV/Drone","href":"/fpv-drone"},
    {"label":"Social Media","href":"/social-media"},
    {"label":"Meet the Team","href":"/team"}
  ]'::jsonb,
  '{
    "title":"PROIMAGEM.PT",
    "subtitleLines":[
      "MULTICAM | AFTERMOVIE | PHOTOGRAPHY",
      "FPV/DRONE | SOCIAL MEDIA | STUDIO SPACE"
    ],
    "buttonText":"VER TRABALHOS",
    "buttonLink":"/studio-space",
    "buttonStyle":"primary",
    "buttonVisible":true,
    "mediaType":"video",
    "visible":true,
    "titleSize":"large",
    "titleAlign":"center",
    "titleColor":"#ffffff"
  }'::jsonb
)
on conflict (id) do nothing;

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800, -- 50 MB (plano Free; Pro permite mais)
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.is_admin());
