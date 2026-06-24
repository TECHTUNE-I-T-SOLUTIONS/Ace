import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StudySessionsService {
  constructor(private readonly supabase: SupabaseService) {}
  list(userId: string) { return this.supabase.admin.from('study_sessions').select('*').eq('user_id', userId); }
}
