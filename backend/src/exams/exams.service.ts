import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string) {
    const { data, error } = await this.supabase.admin.from('exams').select('*').eq('user_id', userId);
    if (error) throw error;
    return { data: data ?? [] };
  }

  async create(userId: string, body: any) {
    const normalized = this.normalize(body);
    const { data, error } = await this.supabase.admin.from('exams').insert({ ...normalized, user_id: userId }).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, body: any) {
    const normalized = this.normalize(body);
    const { data, error } = await this.supabase.admin.from('exams').update(normalized).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase.admin.from('exams').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  }

  private normalize(body: any) {
    const out: any = { ...body };
    if (out.priority) out.priority = String(out.priority).toLowerCase();
    if (out.status) out.status = String(out.status).toLowerCase().replace(/\s+/g, '_');
    return out;
  }
}