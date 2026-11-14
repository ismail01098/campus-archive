create extension if not exists pgcrypto;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  active boolean not null default true
);
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  course_id uuid references public.courses(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  active boolean not null default true,
  unique(name, course_id, semester_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  student_id text,
  course_id uuid references public.courses(id),
  semester_id uuid references public.semesters(id),
  role text not null default 'student' check (role in ('student','admin')),
  status text not null default 'pending_email' check (status in ('pending_email','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  course_id uuid references public.courses(id) on delete cascade,
  max_uses int not null default 1 check (max_uses > 0),
  uses int not null default 0 check (uses >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.question_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course_id uuid not null references public.courses(id),
  semester_id uuid not null references public.semesters(id),
  subject_id uuid not null references public.subjects(id),
  exam_type text not null,
  academic_year text not null,
  description text,
  storage_path text not null unique,
  file_name text not null,
  file_size bigint not null check (file_size > 0),
  sha256 text,
  uploaded_by uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  view_count bigint not null default 0,
  download_count bigint not null default 0,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);
create index if not exists papers_status_created_idx on public.question_papers(status, created_at desc);
create index if not exists papers_course_semester_idx on public.question_papers(course_id, semester_id);
create index if not exists papers_subject_idx on public.question_papers(subject_id);
create index if not exists papers_year_idx on public.question_papers(academic_year);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);
create table if not exists public.question_paper_tags (
  question_paper_id uuid not null references public.question_papers(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key(question_paper_id, tag_id)
);
create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_paper_id uuid not null references public.question_papers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, question_paper_id)
);
create table if not exists public.upload_reports (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.question_papers(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check(status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and status='active') $$;

-- Create student profiles from trusted auth events. The role is forced to student;
-- user-supplied metadata can never grant administrator privileges.
create or replace function public.handle_auth_user_profile()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profiles(id, full_name, student_id, course_id, semester_id, role, status)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
      new.raw_user_meta_data->>'student_id',
      nullif(new.raw_user_meta_data->>'course_id','')::uuid,
      nullif(new.raw_user_meta_data->>'semester_id','')::uuid,
      'student',
      case when new.email_confirmed_at is not null then 'active' else 'pending_email' end
    )
    on conflict(id) do nothing;
  elsif tg_op = 'UPDATE' and old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles set status='active', updated_at=now()
    where id=new.id and role='student' and status='pending_email';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_auth_user_profile();

drop trigger if exists on_auth_user_email_verified on auth.users;
create trigger on_auth_user_email_verified
after update of email_confirmed_at on auth.users
for each row execute procedure public.handle_auth_user_profile();

create or replace function public.redeem_invite_code(p_code text, p_course_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare v_count int;
begin
  if auth.uid() is not null then return false; end if;
  update public.invite_codes
  set uses = uses + 1
  where code_hash = encode(digest(upper(trim(p_code)), 'sha256'),'hex')
    and active = true
    and uses < max_uses
    and (expires_at is null or expires_at > now())
    and (course_id is null or course_id = p_course_id);
  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

create or replace function public.create_invite_code(p_code text, p_course_id uuid, p_max_uses int)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  insert into public.invite_codes(code_hash,course_id,max_uses,created_by)
  values(encode(digest(upper(trim(p_code)),'sha256'),'hex'),p_course_id,greatest(1,least(p_max_uses,500)),auth.uid());
end;
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.semesters enable row level security;
alter table public.subjects enable row level security;
alter table public.invite_codes enable row level security;
alter table public.question_papers enable row level security;
alter table public.tags enable row level security;
alter table public.question_paper_tags enable row level security;
alter table public.bookmarks enable row level security;
alter table public.upload_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

create policy "active catalog courses readable" on public.courses for select using (active or public.is_admin());
create policy "active catalog semesters readable" on public.semesters for select using (active or public.is_admin());
create policy "active catalog subjects readable" on public.subjects for select using (active or public.is_admin());

create policy "profiles own or admin read" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "profiles own insert student only" on public.profiles for insert with check (id=auth.uid() and role='student' and status='pending_email');
-- Students cannot directly update role, verification status or enrollment fields.
-- Use narrowly scoped server-side profile actions if editable profile fields are added later.
create policy "admin manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "approved papers public read" on public.question_papers for select using (status='approved' or uploaded_by=auth.uid() or public.is_admin());
create policy "active students submit papers" on public.question_papers for insert with check (
  uploaded_by=auth.uid() and status='pending'
  and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='student' and p.status='active')
);
create policy "owner edits pending papers" on public.question_papers for update using (uploaded_by=auth.uid() and status='pending') with check (uploaded_by=auth.uid() and status='pending');
create policy "admin manage papers" on public.question_papers for all using (public.is_admin()) with check (public.is_admin());

create policy "tags readable" on public.tags for select using (true);
create policy "admin manage tags" on public.tags for all using (public.is_admin()) with check (public.is_admin());
create policy "paper tags readable approved" on public.question_paper_tags for select using (
 exists(select 1 from public.question_papers p where p.id=question_paper_id and (p.status='approved' or p.uploaded_by=auth.uid() or public.is_admin()))
);
create policy "paper owners add tags" on public.question_paper_tags for insert with check (
 exists(select 1 from public.question_papers p where p.id=question_paper_id and p.uploaded_by=auth.uid() and p.status='pending')
);
create policy "admin manage paper tags" on public.question_paper_tags for all using(public.is_admin()) with check(public.is_admin());

create policy "users manage own bookmarks" on public.bookmarks for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "users create reports" on public.upload_reports for insert with check(reported_by=auth.uid());
create policy "users see own reports admin sees all" on public.upload_reports for select using(reported_by=auth.uid() or public.is_admin());
create policy "admin manage reports" on public.upload_reports for update using(public.is_admin()) with check(public.is_admin());
create policy "users see own notifications" on public.notifications for select using(user_id=auth.uid() or public.is_admin());
create policy "users update own notifications" on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "admin read activity" on public.activity_logs for select using(public.is_admin());
create policy "system insert activity" on public.activity_logs for insert with check(actor_id=auth.uid() or public.is_admin());

revoke all on public.invite_codes from anon, authenticated;
grant execute on function public.redeem_invite_code(text,uuid) to anon, authenticated;
grant execute on function public.create_invite_code(text,uuid,int) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('question-papers','question-papers',false,10485760,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf'];

create policy "verified students upload own files" on storage.objects for insert to authenticated with check (
 bucket_id='question-papers' and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.role='student')
);
create policy "read approved paper files or own files" on storage.objects for select using (
 bucket_id='question-papers' and (
  exists(select 1 from public.question_papers qp where qp.storage_path=name and qp.status='approved')
  or (storage.foldername(name))[1]=auth.uid()::text
  or public.is_admin()
 )
);
create policy "owners delete own files" on storage.objects for delete to authenticated using (
 bucket_id='question-papers' and (storage.foldername(name))[1]=auth.uid()::text and public.is_admin() = false
);
create policy "admin delete paper files" on storage.objects for delete to authenticated using(bucket_id='question-papers' and public.is_admin());
