-- ============================================================================
-- Tamil Nadu Petition Tracking System — complete schema
-- Already applied to project ollhtyeflpggdazrsqsq.
-- Run this only when standing up a NEW Supabase project.
-- ============================================================================

create extension if not exists pg_trgm;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- geography
create table districts (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name_en text not null unique,
  name_ta text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table taluks (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references districts(id) on delete cascade,
  code text,
  name_en text not null,
  name_ta text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (district_id, name_en)
);

create type village_kind as enum ('village','division','ward','panchayat','municipality');

create table villages (
  id uuid primary key default gen_random_uuid(),
  taluk_id uuid not null references taluks(id) on delete cascade,
  code text,
  name_en text not null,
  name_ta text,
  kind village_kind not null default 'village',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (taluk_id, name_en)
);

create index on taluks (district_id);
create index on villages (taluk_id);

-- -------------------------------------------------------------- departments
create table departments (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name_en text not null unique,
  name_ta text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ people
create type app_role as enum ('admin','officer');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  full_name_ta text,
  email text not null,
  phone text,
  role app_role not null default 'officer',
  department_id uuid references departments(id) on delete set null,
  designation text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on profiles (role);
create index on profiles (department_id);

create table profile_villages (
  profile_id uuid not null references profiles(id) on delete cascade,
  village_id uuid not null references villages(id) on delete cascade,
  primary key (profile_id, village_id)
);
create index on profile_villages (village_id);

create table profile_taluks (
  profile_id uuid not null references profiles(id) on delete cascade,
  taluk_id uuid not null references taluks(id) on delete cascade,
  primary key (profile_id, taluk_id)
);
create index on profile_taluks (taluk_id);

-- --------------------------------------------------------------- petitions
create type petition_status   as enum ('new','assigned','in_progress','resolved','rejected');
create type petition_priority as enum ('low','normal','high','urgent');

create table petition_counters (
  year int primary key,
  last_no int not null default 0
);

create table petitions (
  id uuid primary key default gen_random_uuid(),
  petition_no    text unique,          -- PET/2026/000123
  serial_no      int,                  -- col 1  வரிசை எண்
  proceedings_no text,                 -- col 2  நடபடி எண்
  received_date  date not null default current_date, -- col 3
  subject        text not null,        -- col 4.1 தலைப்பு
  description    text,
  writer_name    text,                 -- col 4.2
  outward_no     text,                 -- col 4.3
  outward_date   date,                 -- col 4.3
  action_taken_date date,              -- col 5
  next_action_date  date,              -- col 6
  register_remarks  text,              -- col 7
  petitioner_name    text not null,
  petitioner_father  text,
  petitioner_phone   text,
  petitioner_address text,
  district_id uuid references districts(id) on delete restrict,
  taluk_id    uuid references taluks(id)    on delete restrict,
  village_id  uuid references villages(id)  on delete restrict,
  department_id uuid references departments(id) on delete set null,
  assigned_to   uuid references profiles(id)    on delete set null,
  assigned_at   timestamptz,
  status   petition_status   not null default 'new',
  priority petition_priority not null default 'normal',
  closed_at timestamptz,
  closing_remark text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(petition_no,'')        || ' ' || coalesce(proceedings_no,'')  || ' ' ||
      coalesce(outward_no,'')         || ' ' || coalesce(subject,'')         || ' ' ||
      coalesce(description,'')        || ' ' || coalesce(petitioner_name,'') || ' ' ||
      coalesce(petitioner_father,'')  || ' ' || coalesce(petitioner_phone,'')|| ' ' ||
      coalesce(petitioner_address,'') || ' ' || coalesce(writer_name,'')     || ' ' ||
      coalesce(register_remarks,''))
  ) stored
);

create index petitions_search_idx  on petitions using gin (search_vector);
create index petitions_trgm_idx    on petitions using gin (
  (coalesce(subject,'') || ' ' || coalesce(petitioner_name,'') || ' ' ||
   coalesce(petition_no,'') || ' ' || coalesce(petitioner_phone,'')) gin_trgm_ops);
create index petitions_status_idx   on petitions (status);
create index petitions_village_idx  on petitions (village_id);
create index petitions_taluk_idx    on petitions (taluk_id);
create index petitions_dept_idx     on petitions (department_id);
create index petitions_assigned_idx on petitions (assigned_to);
create index petitions_recvd_idx    on petitions (received_date desc);

create table petition_status_history (
  id uuid primary key default gen_random_uuid(),
  petition_id uuid not null references petitions(id) on delete cascade,
  from_status petition_status,
  to_status   petition_status not null,
  comment text,
  department_id uuid references departments(id) on delete set null,
  assigned_to   uuid references profiles(id) on delete set null,
  changed_by    uuid references profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);
create index on petition_status_history (petition_id, changed_at desc);

create type attachment_kind as enum ('petition_copy','action_proof','other');

create table petition_attachments (
  id uuid primary key default gen_random_uuid(),
  petition_id uuid not null references petitions(id) on delete cascade,
  kind attachment_kind not null default 'petition_copy',
  file_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references profiles(id) on delete set null,
  uploaded_at timestamptz not null default now()
);
create index on petition_attachments (petition_id);

-- ------------------------------------------------------ triggers / helpers
create function set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_petitions_updated before update on petitions
  for each row execute function set_updated_at();
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

create function assign_petition_no() returns trigger
language plpgsql security definer set search_path = public as $$
declare yr int := extract(year from coalesce(new.received_date, current_date)); n int;
begin
  if new.petition_no is not null and new.serial_no is not null then return new; end if;
  insert into petition_counters (year, last_no) values (yr, 1)
  on conflict (year) do update set last_no = petition_counters.last_no + 1
  returning last_no into n;
  new.serial_no   := coalesce(new.serial_no, n);
  new.petition_no := coalesce(new.petition_no, 'PET/' || yr || '/' || lpad(n::text, 6, '0'));
  return new;
end $$;

create trigger trg_petitions_number before insert on petitions
  for each row execute function assign_petition_no();

create function log_petition_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into petition_status_history
    (petition_id, from_status, to_status, comment, department_id, assigned_to, changed_by)
  values (new.id, null, new.status, 'Petition registered / மனு பதிவு செய்யப்பட்டது',
          new.department_id, new.assigned_to, new.created_by);
  return new;
end $$;

create trigger trg_petitions_created after insert on petitions
  for each row execute function log_petition_created();

create function current_role_name() returns app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and is_active $$;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid() and is_active), false) $$;

create function can_view_petition(p_village uuid, p_taluk uuid, p_assigned uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin()
      or p_assigned = auth.uid()
      or exists (select 1 from profile_villages pv
                 where pv.profile_id = auth.uid() and pv.village_id = p_village)
      or exists (select 1 from profile_taluks pt
                 where pt.profile_id = auth.uid() and pt.taluk_id = p_taluk) $$;

-- --------------------------------------------------------------------- RLS
alter table districts               enable row level security;
alter table taluks                  enable row level security;
alter table villages                enable row level security;
alter table departments             enable row level security;
alter table profiles                enable row level security;
alter table profile_villages        enable row level security;
alter table profile_taluks          enable row level security;
alter table petitions               enable row level security;
alter table petition_status_history enable row level security;
alter table petition_attachments    enable row level security;
alter table petition_counters       enable row level security;

do $$
declare t text;
begin
  foreach t in array array['districts','taluks','villages','departments'] loop
    execute format($f$
      create policy "%1$s_read" on %1$s for select to authenticated using (true);
      create policy "%1$s_admin_write" on %1$s for all to authenticated
        using (is_admin()) with check (is_admin());
    $f$, t);
  end loop;
end $$;

create policy profiles_self_read on profiles
  for select to authenticated using (id = auth.uid() or is_admin());
create policy profiles_self_update on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles
  for all to authenticated using (is_admin()) with check (is_admin());

create policy pv_read  on profile_villages for select to authenticated
  using (profile_id = auth.uid() or is_admin());
create policy pv_admin on profile_villages for all to authenticated
  using (is_admin()) with check (is_admin());
create policy pt_read  on profile_taluks for select to authenticated
  using (profile_id = auth.uid() or is_admin());
create policy pt_admin on profile_taluks for all to authenticated
  using (is_admin()) with check (is_admin());

-- Officers read within jurisdiction; only admins write directly.
create policy petitions_read on petitions for select to authenticated
  using (can_view_petition(village_id, taluk_id, assigned_to));
create policy petitions_admin_write on petitions for all to authenticated
  using (is_admin()) with check (is_admin());

create policy history_read on petition_status_history for select to authenticated
  using (exists (select 1 from petitions p where p.id = petition_id
                 and can_view_petition(p.village_id, p.taluk_id, p.assigned_to)));
create policy history_admin on petition_status_history for all to authenticated
  using (is_admin()) with check (is_admin());

create policy attach_read on petition_attachments for select to authenticated
  using (exists (select 1 from petitions p where p.id = petition_id
                 and can_view_petition(p.village_id, p.taluk_id, p.assigned_to)));
create policy attach_insert on petition_attachments for insert to authenticated
  with check (exists (select 1 from petitions p where p.id = petition_id
                      and can_view_petition(p.village_id, p.taluk_id, p.assigned_to)));
create policy attach_delete on petition_attachments for delete to authenticated
  using (is_admin() or uploaded_by = auth.uid());

create policy counters_admin on petition_counters for select to authenticated
  using (is_admin());

-- --------------------------------------------------------------------- RPCs
-- The only way an officer can change a petition.
create function update_petition_status(
  p_petition_id uuid, p_status petition_status,
  p_comment text default null, p_next_action date default null
) returns petitions language plpgsql security definer set search_path = public as $$
declare p petitions; old_status petition_status;
begin
  select * into p from petitions where id = p_petition_id;
  if not found then raise exception 'Petition not found'; end if;
  if not can_view_petition(p.village_id, p.taluk_id, p.assigned_to) then
    raise exception 'Not authorised for this petition'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and is_active) then
    raise exception 'Inactive or unknown user'; end if;

  old_status := p.status;
  update petitions set
    status = p_status,
    next_action_date = coalesce(p_next_action, next_action_date),
    action_taken_date = case when action_taken_date is null then current_date
                             else action_taken_date end,
    closed_at = case when p_status in ('resolved','rejected') then now() else null end,
    closing_remark = case when p_status in ('resolved','rejected')
                          then coalesce(p_comment, closing_remark) else closing_remark end
  where id = p_petition_id returning * into p;

  insert into petition_status_history
    (petition_id, from_status, to_status, comment, department_id, assigned_to, changed_by)
  values (p_petition_id, old_status, p_status, p_comment, p.department_id, p.assigned_to, auth.uid());
  return p;
end $$;

create function add_petition_comment(p_petition_id uuid, p_comment text)
returns petition_status_history language plpgsql security definer set search_path = public as $$
declare p petitions; h petition_status_history;
begin
  select * into p from petitions where id = p_petition_id;
  if not found then raise exception 'Petition not found'; end if;
  if not can_view_petition(p.village_id, p.taluk_id, p.assigned_to) then
    raise exception 'Not authorised for this petition'; end if;
  insert into petition_status_history
    (petition_id, from_status, to_status, comment, department_id, assigned_to, changed_by)
  values (p_petition_id, p.status, p.status, p_comment, p.department_id, p.assigned_to, auth.uid())
  returning * into h;
  return h;
end $$;

-- Keyword search. SECURITY INVOKER, so RLS scopes results to the caller.
create function search_petitions(
  p_query text default null, p_status petition_status default null,
  p_dept uuid default null, p_district uuid default null,
  p_taluk uuid default null, p_village uuid default null,
  p_from date default null, p_to date default null,
  p_limit int default 50, p_offset int default 0
) returns setof petitions language sql stable set search_path = public as $$
  select * from petitions p
  where (p_query is null or btrim(p_query) = ''
         or p.search_vector @@ websearch_to_tsquery('simple', p_query)
         or p.petition_no        ilike '%' || p_query || '%'
         or p.subject            ilike '%' || p_query || '%'
         or p.petitioner_name    ilike '%' || p_query || '%'
         or p.petitioner_phone   ilike '%' || p_query || '%'
         or p.proceedings_no     ilike '%' || p_query || '%'
         or p.description        ilike '%' || p_query || '%'
         or p.petitioner_address ilike '%' || p_query || '%')
    and (p_status   is null or p.status = p_status)
    and (p_dept     is null or p.department_id = p_dept)
    and (p_district is null or p.district_id = p_district)
    and (p_taluk    is null or p.taluk_id = p_taluk)
    and (p_village  is null or p.village_id = p_village)
    and (p_from     is null or p.received_date >= p_from)
    and (p_to       is null or p.received_date <= p_to)
  order by p.received_date desc, p.created_at desc
  limit greatest(1, least(p_limit, 200)) offset greatest(0, p_offset) $$;

create function petition_stats()
returns table (status petition_status, count bigint)
language sql stable set search_path = public as $$
  select p.status, count(*)::bigint from petitions p group by p.status $$;

-- ------------------------------------------------------- account management
create function handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email, role)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          new.email,
          coalesce((new.raw_user_meta_data->>'role')::app_role, 'officer'))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_auth_user();

create function admin_create_user(
  p_email text, p_password text, p_full_name text,
  p_role app_role default 'officer', p_department uuid default null,
  p_designation text default null, p_phone text default null,
  p_full_name_ta text default null
) returns uuid language plpgsql security definer
set search_path = public, auth, extensions as $$
declare new_id uuid := gen_random_uuid(); norm_email text := lower(btrim(p_email));
begin
  if not is_admin() then raise exception 'Only administrators can create accounts'; end if;
  if length(coalesce(p_password,'')) < 8 then
    raise exception 'Password must be at least 8 characters'; end if;
  if exists (select 1 from auth.users u where lower(u.email) = norm_email) then
    raise exception 'An account with this email already exists'; end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
    norm_email, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
    jsonb_build_object('full_name', p_full_name, 'role', p_role::text),
    now(), now(), '', '', '', '');

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), new_id, new_id::text,
    jsonb_build_object('sub', new_id::text, 'email', norm_email, 'email_verified', true),
    'email', now(), now(), now());

  insert into profiles (id, full_name, full_name_ta, email, phone, role, department_id, designation)
  values (new_id, p_full_name, p_full_name_ta, norm_email, p_phone, p_role, p_department, p_designation)
  on conflict (id) do update set
    full_name = excluded.full_name, full_name_ta = excluded.full_name_ta,
    phone = excluded.phone, role = excluded.role,
    department_id = excluded.department_id, designation = excluded.designation;

  return new_id;
end $$;

create function admin_set_password(p_user_id uuid, p_password text)
returns void language plpgsql security definer
set search_path = public, auth, extensions as $$
begin
  if not is_admin() then raise exception 'Only administrators can reset passwords'; end if;
  if length(coalesce(p_password,'')) < 8 then
    raise exception 'Password must be at least 8 characters'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
                        updated_at = now()
   where id = p_user_id;
end $$;

create function admin_delete_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_admin() then raise exception 'Only administrators can delete accounts'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot delete your own account'; end if;
  delete from auth.users where id = p_user_id;
end $$;

-- ------------------------------------------------------------------ grants
revoke execute on function assign_petition_no()   from anon, authenticated, public;
revoke execute on function log_petition_created() from anon, authenticated, public;
revoke execute on function handle_new_auth_user() from anon, authenticated, public;
revoke execute on function set_updated_at()       from anon, authenticated, public;
revoke execute on function can_view_petition(uuid,uuid,uuid) from anon, public;
revoke execute on function current_role_name()    from anon, public;
revoke execute on function is_admin()             from anon, public;

grant execute on function update_petition_status(uuid, petition_status, text, date) to authenticated;
grant execute on function add_petition_comment(uuid, text) to authenticated;
grant execute on function search_petitions(text, petition_status, uuid, uuid, uuid, uuid, date, date, int, int) to authenticated;
grant execute on function petition_stats() to authenticated;
grant execute on function admin_create_user(text,text,text,app_role,uuid,text,text,text) to authenticated;
grant execute on function admin_set_password(uuid, text) to authenticated;
grant execute on function admin_delete_user(uuid) to authenticated;

revoke execute on function update_petition_status(uuid, petition_status, text, date) from anon, public;
revoke execute on function add_petition_comment(uuid, text) from anon, public;
revoke execute on function search_petitions(text, petition_status, uuid, uuid, uuid, uuid, date, date, int, int) from anon, public;
revoke execute on function petition_stats() from anon, public;
revoke execute on function admin_create_user(text,text,text,app_role,uuid,text,text,text) from anon, public;
revoke execute on function admin_set_password(uuid, text) from anon, public;
revoke execute on function admin_delete_user(uuid) from anon, public;

-- ----------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('petition-files','petition-files', false, 15728640,
        array['image/png','image/jpeg','image/jpg','image/webp','image/heic','application/pdf'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "petition_files_read"   on storage.objects for select to authenticated
  using (bucket_id = 'petition-files');
create policy "petition_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'petition-files');
create policy "petition_files_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'petition-files' and (is_admin() or owner = auth.uid()));
