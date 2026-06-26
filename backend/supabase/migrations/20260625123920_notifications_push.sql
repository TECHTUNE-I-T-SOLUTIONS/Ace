-- ACE v5: Push notification tokens, notification triggers, deadline reminders

-- ============================================================
-- 1. PUSH NOTIFICATION TOKENS TABLE
-- ============================================================
create table if not exists public.push_notification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null default 'android',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_push_tokens_user_id on public.push_notification_tokens(user_id);
create index if not exists idx_push_tokens_token on public.push_notification_tokens(token);

alter table public.push_notification_tokens enable row level security;

drop policy if exists "push_tokens_own" on public.push_notification_tokens;
create policy "push_tokens_own" on public.push_notification_tokens 
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists trg_push_tokens_updated_at on public.push_notification_tokens;
create trigger trg_push_tokens_updated_at 
  before update on public.push_notification_tokens 
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. UPSERT FUNCTION FOR PUSH TOKENS
-- ============================================================
create or replace function public.upsert_push_token(
  p_user_id uuid,
  p_token text,
  p_platform text default 'android'
)
returns public.push_notification_tokens
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.push_notification_tokens;
begin
  insert into public.push_notification_tokens (user_id, token, platform)
  values (p_user_id, p_token, p_platform)
  on conflict (user_id)
  do update set token = p_token, platform = p_platform, updated_at = now()
  returning * into result;
  return result;
end;
$$;

-- ============================================================
-- 3. NOTIFICATION INSERT FUNCTION
-- ============================================================
create or replace function public.insert_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text,
  p_scheduled_for timestamptz default null
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.notifications;
begin
  insert into public.notifications (user_id, title, body, type, scheduled_for)
  values (p_user_id, p_title, p_body, p_type, p_scheduled_for)
  returning * into result;
  return result;
end;
$$;

-- ============================================================
-- 4. NOTIFICATION TRIGGERS FOR USER ACTIONS
-- ============================================================

-- 4a. New user signup -> welcome notification
create or replace function public.notify_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_notification(
    new.id,
    'Welcome to ACE!',
    'Welcome aboard! Start by setting up your profile and adding your courses to get the most out of ACE.',
    'welcome'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_signup on auth.users;
create trigger trg_notify_signup
  after insert on auth.users
  for each row execute function public.notify_user_signup();

-- 4b. New course added
create or replace function public.notify_course_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_notification(
    new.user_id,
    'Course Added',
    'You added "' || new.course_title || '" (' || new.course_code || ') to your courses.',
    'course'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_course_added on public.courses;
create trigger trg_notify_course_added
  after insert on public.courses
  for each row execute function public.notify_course_added();

-- 4c. New assignment added
create or replace function public.notify_assignment_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_notification(
    new.user_id,
    'New Assignment',
    '"' || new.title || '" added. Due: ' || new.deadline_date,
    'assignment'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_assignment_added on public.assignments;
create trigger trg_notify_assignment_added
  after insert on public.assignments
  for each row execute function public.notify_assignment_added();

-- 4d. Assignment completed
create or replace function public.notify_assignment_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    perform public.insert_notification(
      new.user_id,
      'Assignment Completed',
      'Great job! "' || new.title || '" has been marked as completed.',
      'assignment_complete'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_assignment_completed on public.assignments;
create trigger trg_notify_assignment_completed
  after update on public.assignments
  for each row execute function public.notify_assignment_completed();

-- 4e. New test added
create or replace function public.notify_test_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_notification(
    new.user_id,
    'Test Scheduled',
    '"' || new.title || '" scheduled for ' || new.date || '.',
    'test'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_test_added on public.tests;
create trigger trg_notify_test_added
  after insert on public.tests
  for each row execute function public.notify_test_added();

-- 4f. New exam added
create or replace function public.notify_exam_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_notification(
    new.user_id,
    'Exam Scheduled',
    '"' || new.title || '" scheduled for ' || new.date || '.',
    'exam'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_exam_added on public.exams;
create trigger trg_notify_exam_added
  after insert on public.exams
  for each row execute function public.notify_exam_added();

-- 4g. New note created
create or replace function public.notify_note_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_notification(
    new.user_id,
    'Note Saved',
    'Your note "' || new.title || '" has been saved.',
    'note'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_note_created on public.notes;
create trigger trg_notify_note_created
  after insert on public.notes
  for each row execute function public.notify_note_created();

-- 4h. New study session added
create or replace function public.notify_session_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_notification(
    new.user_id,
    'Study Session Added',
    'Study session on "' || new.subject || '" added for ' || new.date || '.',
    'study_session'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_session_added on public.study_sessions;
create trigger trg_notify_session_added
  after insert on public.study_sessions
  for each row execute function public.notify_session_added();

-- 4i. Diary entry created
create or replace function public.notify_diary_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_notification(
    new.user_id,
    'Diary Entry Added',
    'New entry: "' || new.title || '"',
    'diary'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_diary_entry on public.diary_entries;
create trigger trg_notify_diary_entry
  after insert on public.diary_entries
  for each row execute function public.notify_diary_entry();

-- 4j. Task created
create or replace function public.notify_task_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_notification(
    new.user_id,
    'Task Created',
    'Task: "' || new.title || '" has been created.',
    'task'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_task_created on public.tasks;
create trigger trg_notify_task_created
  after insert on public.tasks
  for each row execute function public.notify_task_created();

-- ============================================================
-- 5. DEADLINE REMINDERS
-- ============================================================

-- Function to check upcoming deadlines and send reminders
create or replace function public.check_upcoming_deadlines()
returns table(
  user_id uuid,
  notification_title text,
  notification_body text,
  notification_type text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    a.user_id,
    'Assignment Due Soon!'::text,
    '"' || a.title || '" is due ' || a.deadline_date || ' at ' || coalesce(a.deadline_time, 'end of day')::text,
    'deadline_reminder'::text
  from public.assignments a
  where a.status = 'pending'
    and a.deadline_date = (current_date + 1);

  return query
  select 
    a.user_id,
    'Due Today!'::text,
    '"' || a.title || '" is due today' || case when a.deadline_time is not null then ' at ' || a.deadline_time else ' by end of day' end::text,
    'deadline_reminder'::text
  from public.assignments a
  where a.status = 'pending'
    and a.deadline_date = current_date;

  return query
  select 
    t.user_id,
    'Test Today!'::text,
    '"' || t.title || '" is scheduled for today ' || t.date || ' at ' || coalesce(t.time, 'TBD')::text,
    'test_reminder'::text
  from public.tests t
  where t.date = current_date::text;

  return query
  select 
    e.user_id,
    'Exam Today!'::text,
    '"' || e.title || '" is scheduled for today ' || e.date || ' at ' || coalesce(e.time, 'TBD')::text,
    'exam_reminder'::text
  from public.exams e
  where e.date = current_date::text;

  return query
  select 
    t.user_id,
    'Test Tomorrow!'::text,
    '"' || t.title || '" is tomorrow ' || t.date || ' at ' || coalesce(t.time, 'TBD')::text,
    'test_reminder'::text
  from public.tests t
  where t.date = (current_date + 1)::text;

  return query
  select 
    e.user_id,
    'Exam Tomorrow!'::text,
    '"' || e.title || '" is tomorrow ' || e.date || ' at ' || coalesce(e.time, 'TBD')::text,
    'exam_reminder'::text
  from public.exams e
  where e.date = (current_date + 1)::text;
end;
$$;

-- Insert deadline reminders as notifications
create or replace function public.insert_deadline_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reminder record;
begin
  for reminder in select * from public.check_upcoming_deadlines()
  loop
    if not exists (
      select 1 from public.notifications n
      where n.user_id = reminder.user_id
        and n.type = reminder.notification_type
        and n.created_at >= current_date
        and n.body = reminder.notification_body
    ) then
      perform public.insert_notification(
        reminder.user_id,
        reminder.notification_title,
        reminder.notification_body,
        reminder.notification_type
      );
    end if;
  end loop;
end;
$$;

-- ============================================================
-- 6. SERVICE FUNCTION FOR BACKEND PUSH
-- ============================================================
create or replace function public.get_push_tokens_for_notification(
  p_user_ids uuid[]
)
returns table(user_id uuid, token text, platform text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select pnt.user_id, pnt.token, pnt.platform
  from public.push_notification_tokens pnt
  where pnt.user_id = any(p_user_ids);
end;
$$;