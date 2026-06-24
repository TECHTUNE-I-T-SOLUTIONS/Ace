-- Storage and AI launch polish

insert into storage.buckets (id, name, public)
values
  ('attachments', 'attachments', true),
  ('avatars', 'avatars', true)
on conflict (id) do update
set public = excluded.public;

alter table public.ai_conversations
  add column if not exists summary text,
  add column if not exists last_message_at timestamptz;

alter table public.ai_conversations
  add column if not exists thread_id uuid default gen_random_uuid();

create index if not exists idx_ai_conversations_user_last_message on public.ai_conversations(user_id, last_message_at desc nulls last);

alter table public.profiles
  add column if not exists avatar_path text;

-- Storage policies
drop policy if exists "attachments_read_all" on storage.objects;
create policy "attachments_read_all"
on storage.objects for select
using (bucket_id = 'attachments');

drop policy if exists "attachments_insert_own" on storage.objects;
create policy "attachments_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'attachments'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "attachments_update_own" on storage.objects;
create policy "attachments_update_own"
on storage.objects for update
using (
  bucket_id = 'attachments'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'attachments'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "attachments_delete_own" on storage.objects;
create policy "attachments_delete_own"
on storage.objects for delete
using (
  bucket_id = 'attachments'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_read_all"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

