import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SearchService {
  constructor(private readonly supabase: SupabaseService) {}
  async global(userId: string, q: string) {
    const [courses, assignments, tests, exams, notes, diary, tasks] = await Promise.all([
      this.supabase.admin.from('courses').select('*').eq('user_id', userId).ilike('course_title', `%${q}%`),
      this.supabase.admin.from('assignments').select('*').eq('user_id', userId).ilike('title', `%${q}%`),
      this.supabase.admin.from('tests').select('*').eq('user_id', userId).ilike('title', `%${q}%`),
      this.supabase.admin.from('exams').select('*').eq('user_id', userId).ilike('title', `%${q}%`),
      this.supabase.admin.from('notes').select('*').eq('user_id', userId).or(`title.ilike.%${q}%,content.ilike.%${q}%`),
      this.supabase.admin.from('diary_entries').select('*').eq('user_id', userId).or(`title.ilike.%${q}%,content.ilike.%${q}%`),
      this.supabase.admin.from('tasks').select('*').eq('user_id', userId).ilike('title', `%${q}%`),
    ]);
    return {
      courses: courses.data ?? [],
      assignments: assignments.data ?? [],
      tests: tests.data ?? [],
      exams: exams.data ?? [],
      notes: notes.data ?? [],
      diary: diary.data ?? [],
      tasks: tasks.data ?? [],
    };
  }
}
