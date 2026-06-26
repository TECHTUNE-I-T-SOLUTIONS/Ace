-- Add due date column to tasks table
alter table if exists public.tasks
  add column if not exists due date;