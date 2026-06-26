import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly push: PushService,
  ) {}

  async list(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to list notifications: ${error.message}`);
      throw error;
    }
    return { data: data ?? [] };
  }

  async update(id: string, userId: string, body: any) {
    const { data, error } = await this.supabase.admin
      .from('notifications')
      .update(body)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update notification: ${error.message}`);
      throw error;
    }
    return data;
  }

  async markAllRead(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .is('is_read', false)
      .select();

    if (error) {
      this.logger.error(`Failed to mark all read: ${error.message}`);
      throw error;
    }
    return { data: data ?? [] };
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.supabase.admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('is_read', false);

    if (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`);
      throw error;
    }
    return { count: count ?? 0 };
  }

  // ============ PUSH TOKEN MANAGEMENT ============

  async upsertPushToken(userId: string, token: string, platform: string = 'android') {
    // Call the database function
    const { data, error } = await this.supabase.admin.rpc('upsert_push_token', {
      p_user_id: userId,
      p_token: token,
      p_platform: platform,
    });

    if (error) {
      this.logger.error(`Failed to upsert push token: ${error.message}`);
      throw error;
    }
    return data;
  }

  // ============ SEND PUSH ON NEW NOTIFICATION ============

  /** Called by a trigger or manually - sends push for a notification */
  async sendPushForNotification(userId: string, title: string, body: string, type: string) {
    try {
      const { data: tokens, error } = await this.supabase.admin
        .from('push_notification_tokens')
        .select('token, platform')
        .eq('user_id', userId);

      if (error || !tokens || tokens.length === 0) {
        return; // No push tokens registered
      }

      for (const t of tokens) {
        await this.push.sendSmart(t.token, title, body, { type });
      }
    } catch (error) {
      this.logger.error(`Failed to send push for notification: ${(error as Error).message}`);
    }
  }

  /** Run deadline checks and insert reminders */
  async runDeadlineReminders() {
    this.logger.log('Running deadline reminders...');
    try {
      const { error } = await this.supabase.admin.rpc('insert_deadline_reminders');
      if (error) {
        this.logger.error(`Deadline reminder RPC failed: ${error.message}`);
        return { success: false, error: error.message };
      }
      this.logger.log('Deadline reminders inserted');
      return { success: true };
    } catch (error) {
      this.logger.error(`Deadline reminder error: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }
}