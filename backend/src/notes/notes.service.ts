import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotesService {
  constructor(private readonly supabase: SupabaseService) {}
  list(userId: string, q?: { page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc'; search?: string }) {
    const page = Math.max(1, q?.page ?? 1);
    const limit = Math.min(Math.max(q?.limit ?? 20, 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = this.supabase.admin.from('notes').select('*', { count: 'exact' }).eq('user_id', userId).range(from, to);
    if (q?.search) query = query.or(`title.ilike.%${q.search}%,content.ilike.%${q.search}%`);
    query = query.order(q?.sortBy ?? 'created_at', { ascending: q?.order !== 'desc' });
    return query;
  }
  create(userId: string, body: any) { return this.supabase.admin.from('notes').insert({ ...body, user_id: userId }).select().single(); }
  update(id: string, userId: string, body: any) { return this.supabase.admin.from('notes').update(body).eq('id', id).eq('user_id', userId).select().single(); }
  remove(id: string, userId: string) { return this.supabase.admin.from('notes').delete().eq('id', id).eq('user_id', userId); }
  search(userId: string, search: string) {
    return this.supabase.admin.from('notes').select('*').eq('user_id', userId).or(`title.ilike.%${search}%,content.ilike.%${search}%`).order('created_at', { ascending: false });
  }
}
