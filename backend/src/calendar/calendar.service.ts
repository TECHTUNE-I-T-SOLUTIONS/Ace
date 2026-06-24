import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CalendarService {
  constructor(private readonly supabase: SupabaseService) {}
  async agenda(userId: string) {
    const [courses, assignments, tests, exams, sessions] = await Promise.all([
      this.supabase.admin.from('courses').select('id, course_title, day_of_week, start_time, end_time').eq('user_id', userId),
      this.supabase.admin.from('assignments').select('id, title, deadline_date').eq('user_id', userId),
      this.supabase.admin.from('tests').select('id, title, date').eq('user_id', userId),
      this.supabase.admin.from('exams').select('id, title, date').eq('user_id', userId),
      this.supabase.admin.from('study_sessions').select('id, subject, date').eq('user_id', userId),
    ]);
    return { courses: courses.data ?? [], assignments: assignments.data ?? [], tests: tests.data ?? [], exams: exams.data ?? [], sessions: sessions.data ?? [] };
  }
}
