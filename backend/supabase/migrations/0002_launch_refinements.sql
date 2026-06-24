-- Launch refinements for ACE

create index if not exists idx_notes_user_created_at on public.notes(user_id, created_at desc);
create index if not exists idx_notes_search on public.notes using gin ((to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))));
create index if not exists idx_courses_search on public.courses using gin ((to_tsvector('english', coalesce(course_title, '') || ' ' || coalesce(course_code, ''))));
create index if not exists idx_diary_search on public.diary_entries using gin ((to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))));

alter table public.settings
  add column if not exists accent_color text not null default '#3D7CFF',
  add column if not exists theme_variant text not null default 'deep';

alter table public.notifications
  add column if not exists deep_link text,
  add column if not exists category text not null default 'general';

alter table public.notes
  add column if not exists summary text;

create or replace view public.dashboard_counts as
select
  p.id as user_id,
  (select count(*) from public.courses c where c.user_id = p.id) as courses_count,
  (select count(*) from public.assignments a where a.user_id = p.id and a.status = 'pending') as pending_assignments,
  (select count(*) from public.tests t where t.user_id = p.id) as tests_count,
  (select count(*) from public.exams e where e.user_id = p.id) as exams_count,
  (select count(*) from public.notes n where n.user_id = p.id) as notes_count
from public.profiles p;

grant select on public.dashboard_counts to authenticated;
