import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class GradesService {
  constructor(private readonly supabase: SupabaseService) {}
  list(userId: string) { return this.supabase.admin.from('grades').select('*').eq('user_id', userId); }
  create(userId: string, body: any) { return this.supabase.admin.from('grades').insert({ ...body, user_id: userId }).select().single(); }
  update(id: string, userId: string, body: any) { return this.supabase.admin.from('grades').update(body).eq('id', id).eq('user_id', userId).select().single(); }
  remove(id: string, userId: string) { return this.supabase.admin.from('grades').delete().eq('id', id).eq('user_id', userId); }
}
