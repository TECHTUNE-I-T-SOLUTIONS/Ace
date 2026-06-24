import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async me(userId: string) {
    const { data } = await this.supabase.admin.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data;
  }

  async updateMe(userId: string, body: any) {
    const { data, error } = await this.supabase.admin.from('profiles').update(body).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  }
}
