-- ACE initial schema
create extension if not exists pgcrypto;

-- ENUMS
do $$ begin
  create type public.user_role as enum ('student', 'administrator', 'super_administrator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('todo', 'doing', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assignment_status as enum ('pending', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.session_status as enum ('planned', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mood_type as enum ('happy', 'focused', 'stressed', 'neutral');
exception when duplicate_object then null; end $$;

-- HELPERS
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student'),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'table_name', tg_table_name,
    'action', tg_op,
    'record_id', coalesce(new.id, old.id),
    'record', to_jsonb(coalesce(new, old))
  );
  insert into public.audit_logs (table_name, action, record_id, payload, created_at)
  values (tg_table_name, tg_op, coalesce(new.id, old.id), payload, now());
  return coalesce(new, old);
end;
$$;

-- CORE TABLES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  avatar_url text,
  institution text,
  department text,
  level text,
  student_id text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_code text not null,
  course_title text not null,
  lecturer_name text,
  lecturer_phone text,
  lecturer_email text,
  venue text,
  day_of_week text,
  start_time text,
  end_time text,
  credit_unit int,
  semester text,
  academic_session text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  priority public.task_priority not null default 'medium',
  deadline_date date not null,
  deadline_time text,
  status public.assignment_status not null default 'pending',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  date date not null,
  time text,
  venue text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  date date not null,
  time text,
  venue text,
  seat_info text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  goal text not null,
  location text,
  date date not null,
  start_time text not null,
  end_time text not null,
  completion_status public.session_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  content text not null,
  is_favorite boolean not null default false,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  mood public.mood_type not null default 'neutral',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  classes_held int not null default 0,
  classes_attended int not null default 0,
  attendance_percentage numeric(5,2) generated always as (
    case when classes_held = 0 then 0 else round((classes_attended::numeric / classes_held::numeric) * 100, 2) end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  semester text not null,
  credit_units int not null default 0,
  grade_point numeric(4,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  is_read boolean not null default false,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  study_hours numeric(6,2) not null default 0,
  attendance_trend numeric(6,2) not null default 0,
  assignments_completed int not null default 0,
  upcoming_deadlines int not null default 0,
  productivity_score numeric(6,2) not null default 0,
  streak_days int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme text not null default 'dark',
  notifications_enabled boolean not null default true,
  study_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  action text not null,
  record_id uuid,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- UPDATED_AT TRIGGERS
do $$ begin
  create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
  create trigger trg_courses_updated_at before update on public.courses for each row execute function public.set_updated_at();
  create trigger trg_assignments_updated_at before update on public.assignments for each row execute function public.set_updated_at();
  create trigger trg_tests_updated_at before update on public.tests for each row execute function public.set_updated_at();
  create trigger trg_exams_updated_at before update on public.exams for each row execute function public.set_updated_at();
  create trigger trg_sessions_updated_at before update on public.study_sessions for each row execute function public.set_updated_at();
  create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
  create trigger trg_notes_updated_at before update on public.notes for each row execute function public.set_updated_at();
  create trigger trg_diary_updated_at before update on public.diary_entries for each row execute function public.set_updated_at();
  create trigger trg_attendance_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();
  create trigger trg_grades_updated_at before update on public.grades for each row execute function public.set_updated_at();
  create trigger trg_notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();
  create trigger trg_ai_conversations_updated_at before update on public.ai_conversations for each row execute function public.set_updated_at();
  create trigger trg_analytics_updated_at before update on public.analytics_snapshots for each row execute function public.set_updated_at();
  create trigger trg_settings_updated_at before update on public.settings for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;

-- USER PROVISIONING
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- AUDIT LOGGING
do $$ begin
  create trigger trg_courses_audit after insert or update or delete on public.courses for each row execute function public.log_audit();
  create trigger trg_assignments_audit after insert or update or delete on public.assignments for each row execute function public.log_audit();
  create trigger trg_tests_audit after insert or update or delete on public.tests for each row execute function public.log_audit();
  create trigger trg_exams_audit after insert or update or delete on public.exams for each row execute function public.log_audit();
  create trigger trg_tasks_audit after insert or update or delete on public.tasks for each row execute function public.log_audit();
  create trigger trg_notes_audit after insert or update or delete on public.notes for each row execute function public.log_audit();
  create trigger trg_diary_audit after insert or update or delete on public.diary_entries for each row execute function public.log_audit();
exception when duplicate_object then null;
end $$;

-- INDEXES
create index if not exists idx_courses_user_id on public.courses(user_id);
create index if not exists idx_assignments_user_id on public.assignments(user_id);
create index if not exists idx_tests_user_id on public.tests(user_id);
create index if not exists idx_exams_user_id on public.exams(user_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_diary_user_id on public.diary_entries(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.assignments enable row level security;
alter table public.tests enable row level security;
alter table public.exams enable row level security;
alter table public.study_sessions enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.diary_entries enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grades enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.analytics_snapshots enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- OWNED TABLES
do $$ begin
  create policy "courses_own" on public.courses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "assignments_own" on public.assignments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "tests_own" on public.tests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "exams_own" on public.exams for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "sessions_own" on public.study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "tasks_own" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "notes_own" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "diary_own" on public.diary_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "attendance_own" on public.attendance_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "grades_own" on public.grades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "notifications_own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "ai_conversations_own" on public.ai_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "analytics_own" on public.analytics_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "settings_own" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- SERVICE ROLE ACCESS FOR AUDIT LOGS
drop policy if exists "audit_logs_service_read" on public.audit_logs;
create policy "audit_logs_service_read" on public.audit_logs for select using (auth.role() = 'service_role');
