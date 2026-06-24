import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export abstract class BaseRepo {
  constructor(protected readonly supabase: SupabaseService) {}

  protected table<T>(name: string) {
    return this.supabase.admin.from(name) as any as {
      select: any;
      insert: any;
      update: any;
      delete: any;
    };
  }
}
