import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SettingsService {
  constructor(private readonly supabase: SupabaseService) {}
  get(userId: string) { return this.supabase.admin.from('settings').select('*').eq('user_id', userId).maybeSingle(); }
  update(userId: string, body: any) { return this.supabase.admin.from('settings').upsert({ ...body, user_id: userId }).select().single(); }
}
