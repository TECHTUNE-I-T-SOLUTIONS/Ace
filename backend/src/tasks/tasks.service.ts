import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string) {
    this.logger.log(`Listing tasks for user: ${userId}`);
    const { data, error } = await this.supabase.admin
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`List tasks error: ${error.message}`);
      throw error;
    }
    return { data: data ?? [] };
  }

  async create(userId: string, body: any) {
    const normalized = this.normalize(body);
    this.logger.log(`Creating task for user: ${userId}, body: ${JSON.stringify(normalized)}`);
    const { data, error } = await this.supabase.admin
      .from('tasks')
      .insert({ ...normalized, user_id: userId })
      .select()
      .single();

    if (error) {
      this.logger.error(`Create task error: ${error.message}`);
      throw error;
    }
    this.logger.log(`Task created: ${JSON.stringify(data)}`);
    return data;
  }

  async update(id: string, userId: string, body: any) {
    const normalized = this.normalize(body);
    const { data, error } = await this.supabase.admin
      .from('tasks')
      .update(normalized)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Update task error: ${error.message}`);
      throw error;
    }
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase.admin
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Delete task error: ${error.message}`);
      throw error;
    }
    return { success: true };
  }

  private normalize(body: any) {
    const out: any = { ...body };
    if (out.priority) out.priority = String(out.priority).toLowerCase();
    if (out.status) out.status = String(out.status).toLowerCase().replace(/\s+/g, '_');
    if (out.category) out.category = String(out.category).toLowerCase();
    // Normalize due date: empty string → null so Supabase doesn't reject it
    if (out.due === '' || out.due === undefined) {
      out.due = null;
    }
    return out;
  }
}