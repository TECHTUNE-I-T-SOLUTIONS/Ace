import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DiaryService {
  private readonly logger = new Logger(DiaryService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string) {
    const { data, error } = await this.supabase.admin.from('diary_entries').select('*').eq('user_id', userId);
    if (error) throw error;
    return { data: data ?? [] };
  }

  async get(id: string, userId: string) {
    const { data, error } = await this.supabase.admin.from('diary_entries').select('*').eq('id', id).eq('user_id', userId).single();
    if (error) throw error;
    return data;
  }

  async create(userId: string, body: any) {
    const { data, error } = await this.supabase.admin.from('diary_entries').insert({ ...body, user_id: userId }).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, body: any) {
    const { data, error } = await this.supabase.admin.from('diary_entries').update(body).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase.admin.from('diary_entries').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  }
}