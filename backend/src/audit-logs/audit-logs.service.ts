import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly supabase: SupabaseService) {}
  list() { return this.supabase.admin.from('audit_logs').select('*').order('created_at', { ascending: false }); }
}
