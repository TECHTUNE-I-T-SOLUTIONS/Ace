import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly supabase: SupabaseService) {}
  list(userId: string) { return this.supabase.admin.from('attendance_records').select('*').eq('user_id', userId); }
  create(userId: string, body: any) { return this.supabase.admin.from('attendance_records').insert({ ...body, user_id: userId }).select().single(); }
  update(id: string, userId: string, body: any) { return this.supabase.admin.from('attendance_records').update(body).eq('id', id).eq('user_id', userId).select().single(); }
}
