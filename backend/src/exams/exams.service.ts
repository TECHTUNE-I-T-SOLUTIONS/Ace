import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ExamsService {
  constructor(private readonly supabase: SupabaseService) {}
  list(userId: string, q?: { page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc'; filters?: string; search?: string }) {
    const page = Math.max(1, q?.page ?? 1);
    const limit = Math.min(Math.max(q?.limit ?? 20, 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = this.supabase.admin.from('exams').select('*', { count: 'exact' }).eq('user_id', userId).range(from, to);
    if (q?.search) query = query.or(`title.ilike.%${q.search}%,venue.ilike.%${q.search}%`);
    if (q?.filters) query = query.in('status', q.filters.split(',').map((item) => item.trim()).filter(Boolean));
    query = query.order(q?.sortBy ?? 'date', { ascending: q?.order !== 'desc' });
    return query;
  }
  create(userId: string, body: any) { return this.supabase.admin.from('exams').insert({ ...body, user_id: userId }).select().single(); }
  update(id: string, userId: string, body: any) { return this.supabase.admin.from('exams').update(body).eq('id', id).eq('user_id', userId).select().single(); }
  remove(id: string, userId: string) { return this.supabase.admin.from('exams').delete().eq('id', id).eq('user_id', userId); }
}
