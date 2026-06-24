import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DiaryService {
  constructor(private readonly supabase: SupabaseService) {}
  list(userId: string) { return this.supabase.admin.from('diary_entries').select('*').eq('user_id', userId); }
  create(userId: string, body: any) { return this.supabase.admin.from('diary_entries').insert({ ...body, user_id: userId }).select().single(); }
}
