import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SettingsService {
  constructor(private readonly supabase: SupabaseService) {}
  
  async get(userId: string): Promise<any> {
    const result = await this.supabase.admin.from('settings').select('*').eq('user_id', userId).maybeSingle();
    // Return default values if no settings record exists
    if (!result.data) {
      return { data: { user_id: userId, notifications_enabled: true, study_reminders: true } };
    }
    return result;
  }
  
  update(userId: string, body: any) { return this.supabase.admin.from('settings').upsert({ ...body, user_id: userId }).select().single(); }
}
