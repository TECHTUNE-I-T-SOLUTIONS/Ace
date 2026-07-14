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
    
    // Also send push notifications for any new notifications after token registration
    await this.sendPendingNotifications(userId, token, platform);
    
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

  /** Send pending notifications to newly registered token */
  private async sendPendingNotifications(userId: string, token: string, platform: string) {
    try {
      // Get unread notifications from the last 24 hours
      const { data: notifications, error } = await this.supabase.admin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('is_read', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !notifications || notifications.length === 0) {
        return;
      }

      // Send push notifications for recent unread notifications
      for (const notification of notifications) {
        await this.push.sendSmart(token, notification.title, notification.body, { 
          type: notification.type,
          category: notification.category 
        });
      }

      this.logger.log(`Sent ${notifications.length} pending notifications to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send pending notifications: ${(error as Error).message}`);
    }
  }

  /** Run deadline checks and insert reminders */
  async runDeadlineReminders() {
    this.logger.log('Running deadline reminders...');
    try {
      const { data, error } = await this.supabase.admin.rpc('insert_deadline_reminders');
      if (error) {
        this.logger.error(`Deadline reminder RPC failed: ${error.message}`);
        return { success: false, error: error.message };
      }
      
      const result = data as any;
      this.logger.log(`Deadline reminders inserted: ${result?.count || 0} notifications`);
      
      // Send push notifications for the newly created reminders
      if (result?.count > 0) {
        await this.sendReminderPushNotifications();
      }
      
      return { success: true, count: result?.count || 0 };
    } catch (error) {
      this.logger.error(`Deadline reminder error: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /** Send push notifications for deadline reminders */
  private async sendReminderPushNotifications() {
    try {
      // Get recently created reminder notifications
      const { data: notifications, error } = await this.supabase.admin
        .from('notifications')
        .select('*')
        .eq('type', 'reminder')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .is('is_read', false);

      if (error || !notifications || notifications.length === 0) {
        return;
      }

      // Group by user and send push notifications
      const userNotifications = new Map<string, any[]>();
      for (const notification of notifications) {
        const userNotifs = userNotifications.get(notification.user_id) || [];
        userNotifs.push(notification);
        userNotifications.set(notification.user_id, userNotifs);
      }

      for (const [userId, userNotifs] of userNotifications.entries()) {
        // Get user's push tokens
        const { data: tokens, error: tokenError } = await this.supabase.admin
          .from('push_notification_tokens')
          .select('token, platform')
          .eq('user_id', userId);

        if (tokenError || !tokens || tokens.length === 0) {
          continue;
        }

        // Check if user has notifications enabled in settings
        const { data: settings } = await this.supabase.admin
          .from('settings')
          .select('notifications_enabled')
          .eq('user_id', userId)
          .single();

        if (!settings?.notifications_enabled) {
          continue;
        }

        // Send push notifications for each reminder
        for (const notification of userNotifs) {
          for (const token of tokens) {
            await this.push.sendSmart(token.token, notification.title, notification.body, { 
              type: notification.type,
              category: notification.category 
            });
          }
        }
      }

      this.logger.log(`Sent push notifications for ${notifications.length} deadline reminders`);
    } catch (error) {
      this.logger.error(`Failed to send reminder push notifications: ${(error as Error).message}`);
    }
  }

  /** Send a test notification to verify push token is working */
  async sendTestNotification(userId: string, token: string) {
    try {
      await this.push.sendSmart(token, 'Push Notifications Enabled!', 'You will now receive notifications for assignments, tests, and deadlines.', { 
        type: 'test',
        category: 'system'
      });
      this.logger.log(`Test notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send test notification: ${(error as Error).message}`);
    }
  }

  /** Send test notification to all tokens for a user */
  async sendTestNotificationToUser(userId: string) {
    try {
      const { data: tokens, error } = await this.supabase.admin
        .from('push_notification_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error || !tokens || tokens.length === 0) {
        return { success: false, message: 'No push tokens found' };
      }

      for (const tokenObj of tokens) {
        await this.push.sendSmart(tokenObj.token, 'Test Notification', 'This is a test notification from Ace.', { 
          type: 'test',
          category: 'system'
        });
      }

      this.logger.log(`Test notification sent to ${tokens.length} tokens for user ${userId}`);
      return { success: true, message: `Test notification sent to ${tokens.length} device(s)` };
    } catch (error) {
      this.logger.error(`Failed to send test notification to user: ${(error as Error).message}`);
      return { success: false, message: (error as Error).message };
    }
  }

  /** Send push notification when user creates a new item */
  async sendItemCreatedNotification(userId: string, itemType: string, itemTitle: string) {
    try {
      this.logger.log(`Attempting to send item created notification for ${itemType}: ${itemTitle} to user ${userId}`);

      // Check if user has notifications enabled
      const { data: settings, error: settingsError } = await this.supabase.admin
        .from('settings')
        .select('notifications_enabled')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (settingsError) {
        this.logger.warn(`Failed to fetch settings for user ${userId}: ${settingsError.message}`);
      }

      // If no settings record exists, assume notifications are enabled (default behavior)
      const notificationsEnabled = settings?.notifications_enabled !== false;

      if (!notificationsEnabled) {
        this.logger.log(`Notifications disabled for user ${userId}, skipping push notification`);
        return;
      }

      // Get user's push tokens
      const { data: tokens, error: tokenError } = await this.supabase.admin
        .from('push_notification_tokens')
        .select('token')
        .eq('user_id', userId);

      if (tokenError) {
        this.logger.error(`Failed to fetch push tokens for user ${userId}: ${tokenError.message}`);
        return;
      }

      if (!tokens || tokens.length === 0) {
        this.logger.log(`No push tokens found for user ${userId}, skipping push notification`);
        return;
      }

      const title = `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Created`;
      const body = `You successfully created "${itemTitle}"`;

      this.logger.log(`Sending push notification to ${tokens.length} token(s) for user ${userId}`);

      for (const tokenObj of tokens) {
        await this.push.sendSmart(tokenObj.token, title, body, { 
          type: 'item_created',
          category: itemType,
          itemType
        });
      }

      // Also create a notification record
      await this.supabase.admin.from('notifications').insert({
        user_id: userId,
        title,
        body,
        type: 'info',
        category: itemType,
        is_read: false,
      });

      this.logger.log(`Item created notification sent successfully for ${itemType}: ${itemTitle}`);
    } catch (error) {
      this.logger.error(`Failed to send item created notification: ${(error as Error).message}`);
    }
  }

  /** Send push notification when user logs in */
  async sendLoginNotification(userId: string) {
    try {
      this.logger.log(`Attempting to send login notification for user ${userId}`);

      // Check if user has notifications enabled
      const { data: settings, error: settingsError } = await this.supabase.admin
        .from('settings')
        .select('notifications_enabled')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (settingsError) {
        this.logger.warn(`Failed to fetch settings for user ${userId}: ${settingsError.message}`);
      }

      // If no settings record exists, assume notifications are enabled (default behavior)
      const notificationsEnabled = settings?.notifications_enabled !== false;

      if (!notificationsEnabled) {
        this.logger.log(`Notifications disabled for user ${userId}, skipping login notification`);
        return;
      }

      // Get user's push tokens
      const { data: tokens, error: tokenError } = await this.supabase.admin
        .from('push_notification_tokens')
        .select('token')
        .eq('user_id', userId);

      if (tokenError) {
        this.logger.error(`Failed to fetch push tokens for user ${userId}: ${tokenError.message}`);
        return;
      }

      if (!tokens || tokens.length === 0) {
        this.logger.log(`No push tokens found for user ${userId}, skipping login notification`);
        return;
      }

      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      this.logger.log(`Sending login notification to ${tokens.length} token(s) for user ${userId}`);

      for (const tokenObj of tokens) {
        await this.push.sendSmart(tokenObj.token, 'Welcome Back!', `You logged in at ${timeString}`, { 
          type: 'login',
          category: 'system'
        });
      }

      this.logger.log(`Login notification sent successfully for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send login notification: ${(error as Error).message}`);
    }
  }

  /** Send push notification when user signs up */
  async sendSignupNotification(userId: string) {
    try {
      // Get user's push tokens
      const { data: tokens, error } = await this.supabase.admin
        .from('push_notification_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error || !tokens || tokens.length === 0) {
        return;
      }

      for (const tokenObj of tokens) {
        await this.push.sendSmart(tokenObj.token, 'Welcome to Ace!', 'Your account has been created successfully. Start organizing your academic life!', { 
          type: 'signup',
          category: 'system'
        });
      }

      this.logger.log(`Signup notification sent for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send signup notification: ${(error as Error).message}`);
    }
  }
}