import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly supabase: SupabaseService) {}
  async overview(userId: string) {
    const [courses, assignments, tests, exams, tasks] = await Promise.all([
      this.supabase.admin.from('courses').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('assignments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('tests').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('exams').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    return {
      courses: courses.count ?? 0,
      assignments: assignments.count ?? 0,
      tests: tests.count ?? 0,
      exams: exams.count ?? 0,
      tasks: tasks.count ?? 0,
    };
  }
}
