import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string, q?: { page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc'; filters?: string; search?: string }) {
    const page = Math.max(1, q?.page ?? 1);
    const limit = Math.min(Math.max(q?.limit ?? 20, 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = this.supabase.admin.from('assignments').select('*', { count: 'exact' }).eq('user_id', userId).range(from, to);
    if (q?.search) query = query.or(`title.ilike.%${q.search}%,description.ilike.%${q.search}%`);
    if (q?.filters) query = query.in('priority', q.filters.split(',').map((item) => item.trim()).filter(Boolean));
    query = query.order(q?.sortBy ?? 'deadline_date', { ascending: q?.order !== 'desc' });
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async create(userId: string, body: any) {
    const normalized = this.normalize(body);
    const { data, error } = await this.supabase.admin.from('assignments').insert({ ...normalized, user_id: userId }).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, body: any) {
    const normalized = this.normalize(body);
    const { data, error } = await this.supabase.admin.from('assignments').update(normalized).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase.admin.from('assignments').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  }

  private normalize(body: any) {
    const out: any = { ...body };
    if (out.priority) out.priority = String(out.priority).toLowerCase();
    if (out.status) {
      const status = String(out.status).toLowerCase().replace(/\s+/g, '_');
      // Map frontend values to database enum values (pending, completed)
      if (status === 'in_progress' || status === 'doing' || status === 'todo') out.status = 'pending';
      else if (status === 'completed' || status === 'done') out.status = 'completed';
    }
    return out;
  }
}