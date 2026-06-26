import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string) {
    const { data, error } = await this.supabase.admin.from('grades').select('*').eq('user_id', userId);
    if (error) throw error;
    return { data: data ?? [] };
  }

  async getCourses(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('courses')
      .select('id, course_code, course_title')
      .eq('user_id', userId)
      .order('course_code');
    if (error) throw error;
    return data ?? [];
  }

  async create(userId: string, body: any) {
    // Validate required fields
    if (!body.course_id) {
      throw new Error('Course is required');
    }
    if (!body.semester) {
      throw new Error('Semester is required');
    }
    if (body.course_id === '' || body.course_id === null || body.course_id === undefined) {
      throw new Error('Please select a valid course');
    }

    const { data, error } = await this.supabase.admin.from('grades').insert({ 
      ...body, 
      user_id: userId,
      credit_units: body.credit_units ?? 0,
      grade_point: body.grade_point ?? 0
    }).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, body: any) {
    // Validate required fields
    if (!body.course_id) {
      throw new Error('Course is required');
    }
    if (!body.semester) {
      throw new Error('Semester is required');
    }
    if (body.course_id === '' || body.course_id === null || body.course_id === undefined) {
      throw new Error('Please select a valid course');
    }

    const { data, error } = await this.supabase.admin.from('grades').update({
      ...body,
      credit_units: body.credit_units ?? 0,
      grade_point: body.grade_point ?? 0
    }).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase.admin.from('grades').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  }
}
