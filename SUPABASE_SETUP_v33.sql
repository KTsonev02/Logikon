-- LOGIKON v33: execute once in Supabase > SQL Editor, as project owner.
-- This is a schema migration, not a client-side script.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_path text,
  created_at timestamptz not null default now(),
  constraint username_length check (char_length(trim(username)) between 3 and 30),
  constraint avatar_owner check (avatar_path is null or avatar_path like id::text || '/%')
);
create unique index if not exists profiles_username_unique on public.profiles (lower(username));
create table if not exists public.daily_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in ('word','sudoku','connections','numbers','palindrome','safe','pirates','guardians','logic','differences')),
  day date not null,
  points integer not null check (points between 0 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id,game,day)
);
create index if not exists daily_scores_day_idx on public.daily_scores(day);
create or replace function public.logikon_create_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.profiles(id,username)
 values(new.id,'Играч_'||substr(replace(new.id::text,'-',''),1,12))
 on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists logikon_user_created on auth.users;
create trigger logikon_user_created after insert on auth.users for each row execute function public.logikon_create_profile();
-- Create profiles for users registered before installing this migration.
insert into public.profiles(id,username)
select id,'Играч_'||substr(replace(id::text,'-',''),1,12) from auth.users
on conflict(id) do nothing;
alter table public.profiles enable row level security;
alter table public.daily_scores enable row level security;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to anon,authenticated using(true);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);
-- No direct INSERT/UPDATE/DELETE policies on daily_scores.
revoke all on public.daily_scores from anon,authenticated;
grant select on public.profiles to anon,authenticated;
grant update(username,avatar_path) on public.profiles to authenticated;
-- SECURITY DEFINER RPC bounds scores and prevents rewriting past dates,
-- but CANNOT verify that a puzzle was actually solved in a static website.
create or replace function public.submit_daily_score(p_game text,p_points integer,p_day date)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Login required'; end if;
 if p_game is null or p_game not in ('word','sudoku','connections','numbers','palindrome','safe','pirates','guardians','logic','differences') then raise exception 'Invalid game'; end if;
 if p_points is null or p_points<0 or p_points>100 then raise exception 'Invalid points'; end if;
 if p_day is distinct from (now() at time zone 'Europe/Sofia')::date then raise exception 'Only today is accepted'; end if;
 insert into public.daily_scores(user_id,game,day,points) values(uid,p_game,p_day,p_points)
 on conflict(user_id,game,day) do update set points=greatest(public.daily_scores.points,excluded.points);
end $$;
revoke all on function public.submit_daily_score(text,integer,date) from public;
grant execute on function public.submit_daily_score(text,integer,date) to authenticated;
create or replace function public.get_leaderboard(p_period text default 'all')
returns table(username text,avatar_path text,total_points bigint) language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if p_period not in ('today','week','month','all') then raise exception 'Invalid period'; end if;
 return query
 select p.username,p.avatar_path,sum(s.points)::bigint as total_points
 from public.daily_scores s join public.profiles p on p.id=s.user_id
 where p_period='all'
 or (p_period='today' and s.day=(now() at time zone 'Europe/Sofia')::date)
 or (p_period='week' and s.day>=date_trunc('week',now() at time zone 'Europe/Sofia')::date)
 or (p_period='month' and s.day>=date_trunc('month',now() at time zone 'Europe/Sofia')::date)
 group by p.id,p.username,p.avatar_path
 order by total_points desc,p.username asc limit 100;
end $$;
revoke all on function public.get_leaderboard(text) from public;
grant execute on function public.get_leaderboard(text) to anon,authenticated;
-- Avatar bucket is public so leaderboard visitors can see pictures.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists avatar_upload_own on storage.objects;
create policy avatar_upload_own on storage.objects for insert to authenticated
with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists avatar_update_own on storage.objects;
create policy avatar_update_own on storage.objects for update to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists avatar_delete_own on storage.objects;
create policy avatar_delete_own on storage.objects for delete to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
