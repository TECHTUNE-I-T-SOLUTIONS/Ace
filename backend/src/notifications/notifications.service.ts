import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}
  list(userId: string) { return this.supabase.admin.from('notifications').select('*').eq('user_id', userId); }
  update(id: string, userId: string, body: any) { return this.supabase.admin.from('notifications').update(body).eq('id', id).eq('user_id', userId).select().single(); }
}
