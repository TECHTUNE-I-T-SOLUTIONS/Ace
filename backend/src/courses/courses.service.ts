import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string, q?: { page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc'; filters?: string; search?: string }) {
    const page = Math.max(1, q?.page ?? 1);
    const limit = Math.min(Math.max(q?.limit ?? 20, 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = this.supabase.admin.from('courses').select('*', { count: 'exact' }).eq('user_id', userId).range(from, to);
    if (q?.search) query = query.or(`course_title.ilike.%${q.search}%,course_code.ilike.%${q.search}%`);
    if (q?.filters) {
      const filters = q.filters.split(',').map((item) => item.trim()).filter(Boolean);
      if (filters.length) query = query.in('day_of_week', filters);
    }
    query = query.order(q?.sortBy ?? 'created_at', { ascending: q?.order !== 'desc' });
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async create(userId: string, body: any) {
    const { data, error } = await this.supabase.admin.from('courses').insert({ ...body, user_id: userId }).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, body: any) {
    const { data, error } = await this.supabase.admin.from('courses').update(body).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase.admin.from('courses').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  }
}