import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async me(userId: string) {
    const { data: profile } = await this.supabase.admin.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!profile) return null;

    // Fetch computed stats
    const [coursesResult, assignmentsResult, gradesResult] = await Promise.all([
      this.supabase.admin.from('courses').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('assignments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin.from('grades').select('grade_point,credit_units').eq('user_id', userId),
    ]);

    const coursesCount = coursesResult.count ?? 0;
    const assignmentsCount = assignmentsResult.count ?? 0;
    const grades = gradesResult.data ?? [];

    // Calculate GPA/CGPA from grades
    let gpa = '0.0';
    if (grades.length > 0) {
      let totalPoints = 0;
      let totalCredits = 0;
      for (const g of grades) {
        const gradeVal = Number(g.grade_point) || 0;
        const creditUnits = Number(g.credit_units) || 1;
        totalPoints += gradeVal * creditUnits;
        totalCredits += creditUnits;
      }
      if (totalCredits > 0) {
        gpa = (totalPoints / totalCredits).toFixed(2);
      }
    }

    return {
      ...profile,
      courses_count: coursesCount,
      assignments_count: assignmentsCount,
      gpa,
      cgpa: gpa,
    };
  }

  async updateMe(userId: string, body: any) {
    const { data, error } = await this.supabase.admin.from('profiles').update(body).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  }
}
