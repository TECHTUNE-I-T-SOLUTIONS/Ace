import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string) {
    const { data, error } = await this.supabase.admin.from('notes').select('*').eq('user_id', userId);
    if (error) throw error;
    return { data: data ?? [] };
  }

  async create(userId: string, body: any) {
    const { data, error } = await this.supabase.admin.from('notes').insert({ ...body, user_id: userId }).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, body: any) {
    const { data, error } = await this.supabase.admin.from('notes').update(body).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase.admin.from('notes').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  }
}