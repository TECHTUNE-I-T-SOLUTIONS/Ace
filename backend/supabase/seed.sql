insert into public.profiles (id, email, full_name, role, institution, department, level, student_id)
values
  ('00000000-0000-0000-0000-000000000001', 'student@ace.app', 'John Doe', 'student', 'University of Technology', 'Computer Science', '300', 'CS-2023-001234')
on conflict (id) do nothing;

insert into public.settings (user_id, theme, notifications_enabled, study_reminders, accent_color, theme_variant)
values
  ('00000000-0000-0000-0000-000000000001', 'dark', true, true, '#3D7CFF', 'deep')
on conflict do nothing;

insert into public.courses (user_id, course_code, course_title, lecturer_name, venue, day_of_week, start_time, end_time)
values
  ('00000000-0000-0000-0000-000000000001', 'CSC 301', 'Data Structures', 'Dr. Bassey', 'LT 101', 'Mon', '09:00', '10:30'),
  ('00000000-0000-0000-0000-000000000001', 'CSC 305', 'Web Development', 'Engr. Musa', 'LAB 204', 'Wed', '11:00', '12:30')
on conflict do nothing;

insert into public.tasks (user_id, title, description, category, priority, status)
values
  ('00000000-0000-0000-0000-000000000001', 'Complete React Assignment', 'Build a responsive app', 'academic', 'high', 'todo'),
  ('00000000-0000-0000-0000-000000000001', 'Gym Workout', 'Cardio and strength training', 'personal', 'medium', 'doing')
on conflict do nothing;
