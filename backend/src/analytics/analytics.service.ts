import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getOverview(userId: string) {
    const [
      coursesResult,
      assignmentsResult,
      testsResult,
      examsResult,
      tasksResult,
      attendanceResult,
    ] = await Promise.all([
      this.supabase.admin.from('courses').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('assignments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('tests').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('exams').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('attendance_records').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    if (coursesResult.error) throw coursesResult.error;
    if (assignmentsResult.error) throw assignmentsResult.error;
    if (testsResult.error) throw testsResult.error;
    if (examsResult.error) throw examsResult.error;
    if (tasksResult.error) throw tasksResult.error;
    if (attendanceResult.error) throw attendanceResult.error;

    return {
      courses: coursesResult.count ?? 0,
      assignments: assignmentsResult.count ?? 0,
      tests: testsResult.count ?? 0,
      exams: examsResult.count ?? 0,
      tasks: tasksResult.count ?? 0,
      attendance: attendanceResult.count ?? 0,
    };
  }
}