-- Phase 9: preserve the Phase 6–8 models, including schematic demo coordinates.
create type public.verification_level as enum ('community_submitted', 'confirmed', 'verified');
create type public.barrier_category as enum ('blocked_walkway', 'lift_unavailable', 'missing_ramp', 'construction', 'poor_lighting', 'flooded_path', 'unsafe_crossing', 'incorrect_map');
create type public.condition_type as enum ('temporary', 'permanent', 'unknown');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  prefer_well_lit boolean not null default false,
  avoid_stairs boolean not null default false,
  avoid_steep_slopes boolean not null default false,
  prefer_ramps_elevators boolean not null default false,
  prefer_public_areas boolean not null default false,
  prefer_covered_paths boolean not null default false,
  max_detour_minutes integer check (max_detour_minutes between 0 and 60),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 100),
  notes text not null default '' check (char_length(notes) <= 2000),
  purpose_tags text[] not null check (cardinality(purpose_tags) between 1 and 6 and purpose_tags <@ array['Walking','Jogging','Shortcut','Accessible','Scenic','Covered']),
  route jsonb not null check (jsonb_typeof(route) = 'object' and route->>'coordinateSystem' = 'schematic_demo' and jsonb_typeof(route->'geometry') = 'array' and jsonb_array_length(route->'geometry') >= 2),
  accessibility_tags text[] not null default '{}' check (accessibility_tags <@ array['Step-free','Ramp available','Elevator required','Accessible entrance','Stairs present'] and not (accessibility_tags @> array['Step-free','Stairs present'])),
  warnings text[] not null default '{}' check (warnings <@ array['Steep section','Construction nearby','Narrow path','Poor lighting reported','Lift may be unavailable']),
  last_walked_at date,
  photo_path text check (photo_path is null or photo_path ~ ('^community-routes/' || user_id::text || '/' || id::text || '/photo\.(jpg|png|webp)$')),
  verification_level public.verification_level not null default 'community_submitted',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.barrier_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category public.barrier_category not null,
  location jsonb not null check (jsonb_typeof(location) = 'object' and location->>'coordinateSystem' = 'schematic_demo' and char_length(location->>'label') > 0 and jsonb_typeof(location->'point') = 'array' and jsonb_array_length(location->'point') = 2),
  description text not null check (char_length(btrim(description)) between 1 and 2000),
  condition_type public.condition_type not null,
  reported_at timestamptz not null default now(),
  expires_at timestamptz,
  photo_path text check (photo_path is null or photo_path ~ ('^barrier-reports/' || user_id::text || '/' || id::text || '/photo\.(jpg|png|webp)$')),
  verification_level public.verification_level not null default 'community_submitted',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index community_routes_feed on public.community_routes (created_at desc) where published;
create index community_routes_owner on public.community_routes (user_id);
create index barrier_reports_feed on public.barrier_reports (reported_at desc) where published;
create index barrier_reports_owner on public.barrier_reports (user_id);
create index barrier_reports_expiry on public.barrier_reports (expires_at) where expires_at is not null;

-- Invoker triggers protect fields even when a caller bypasses the UI.
create function public.guard_community_write() returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() in ('authenticated', 'anon') then
    if tg_op = 'INSERT' and new.verification_level <> 'community_submitted' then
      raise exception 'Verification is reserved for trusted administration' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and (new.verification_level is distinct from old.verification_level or new.user_id is distinct from old.user_id or new.id is distinct from old.id) then
      raise exception 'Ownership and verification cannot be changed' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'UPDATE' then new.created_at = old.created_at; end if;
  new.updated_at = now();
  return new;
end $$;
create trigger community_routes_guard before insert or update on public.community_routes for each row execute function public.guard_community_write();
create trigger barrier_reports_guard before insert or update on public.barrier_reports for each row execute function public.guard_community_write();
create function public.profile_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.created_at = old.created_at;
  new.updated_at = now();
  return new;
end $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.profile_updated_at();
create function public.report_expiry() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then new.reported_at = now(); else new.reported_at = old.reported_at; end if;
  new.expires_at = case when new.condition_type = 'temporary' then new.reported_at + interval '24 hours' else null end;
  return new;
end $$;
create trigger barrier_reports_expiry before insert or update on public.barrier_reports for each row execute function public.report_expiry();

alter table public.profiles enable row level security;
alter table public.community_routes enable row level security;
alter table public.barrier_reports enable row level security;
revoke all on public.profiles, public.community_routes, public.barrier_reports from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.community_routes, public.barrier_reports to authenticated;
grant select on public.community_routes, public.barrier_reports to anon;

create policy profiles_read on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete on public.profiles for delete to authenticated using ((select auth.uid()) = id);
create policy routes_read on public.community_routes for select to anon, authenticated using (published or (select auth.uid()) = user_id);
create policy routes_insert on public.community_routes for insert to authenticated with check ((select auth.uid()) = user_id and verification_level = 'community_submitted');
create policy routes_update on public.community_routes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy routes_delete on public.community_routes for delete to authenticated using ((select auth.uid()) = user_id);
create policy reports_read on public.barrier_reports for select to anon, authenticated using (published or (select auth.uid()) = user_id);
create policy reports_insert on public.barrier_reports for insert to authenticated with check ((select auth.uid()) = user_id and verification_level = 'community_submitted');
create policy reports_update on public.barrier_reports for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy reports_delete on public.barrier_reports for delete to authenticated using ((select auth.uid()) = user_id);

-- One public-read bucket; only route/report images, never identity documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jom-community-images', 'jom-community-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']);
create policy jom_images_read on storage.objects for select to anon, authenticated using (bucket_id = 'jom-community-images');
create policy jom_images_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'jom-community-images'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 3
  and storage.filename(name) ~ '^photo\.(jpg|png|webp)$'
  and (
    ((storage.foldername(name))[1] = 'community-routes' and exists (select 1 from public.community_routes r where r.id::text = (storage.foldername(name))[3] and r.user_id = (select auth.uid()) and not r.published))
    or ((storage.foldername(name))[1] = 'barrier-reports' and exists (select 1 from public.barrier_reports r where r.id::text = (storage.foldername(name))[3] and r.user_id = (select auth.uid()) and not r.published))
  )
);
-- No UPDATE policy: uploads use upsert:false and cannot overwrite anyone's files.
create policy jom_images_delete on storage.objects for delete to authenticated using (
  bucket_id = 'jom-community-images' and (storage.foldername(name))[2] = (select auth.uid())::text
);
