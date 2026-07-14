import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service';
import { PushService } from './push.service';

@ApiTags('reminders')
@Controller('reminders')
export class RemindersController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly push: PushService,
  ) {}

  @Get('cron')
  @ApiOperation({ summary: 'Cron endpoint - sends push notifications for upcoming events' })
  async sendReminders() {
    const now = new Date();
    const results: any[] = [];

    try {
      // Get all users with push tokens
      const { data: tokens, error: tokensError } = await this.supabase.admin
        .from('push_notification_tokens')
        .select('user_id, token');

      if (tokensError || !tokens?.length) {
        return { message: 'No push tokens found', sent: 0, success: true };
      }

      // Group tokens by user
      const userTokens = new Map<string, string[]>();
      tokens.forEach(({ user_id, token }) => {
        const existing = userTokens.get(user_id) || [];
        existing.push(token);
        userTokens.set(user_id, existing);
      });

      // Check for assignments due in next 24 hours
      const notificationWindows = [24, 18, 12, 6, 3, 1];
      const today = now.toISOString().split('T')[0];
      const userIds = Array.from(userTokens.keys());
      
      for (const hoursAhead of notificationWindows) {
        const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
        const futureDate = futureTime.toISOString().split('T')[0];
        const { data: upcomingAssignments } = await this.supabase.admin
          .from('assignments')
          .select('id, title, user_id, deadline_date, deadline_time')
          .in('user_id', userIds)
          .gte('deadline_date', today)
          .lte('deadline_date', futureDate);

        if (upcomingAssignments?.length) {
          for (const assignment of upcomingAssignments) {
            const userTokenList = userTokens.get(assignment.user_id);
            if (userTokenList) {
              // Check if user has notifications enabled
              const { data: settings } = await this.supabase.admin
                .from('settings')
                .select('notifications_enabled')
                .eq('user_id', assignment.user_id)
                .single();

              if (!settings?.notifications_enabled) {
                continue;
              }

              const timeText = hoursAhead >= 24 ? `in ${hoursAhead} hours` : 
                              hoursAhead >= 1 ? `in ${hoursAhead} hour${hoursAhead > 1 ? 's' : ''}` : 
                              'very soon';
              
              // Check if already notified for this window
              const { data: existingNotification } = await this.supabase.admin
                .from('notifications')
                .select('id')
                .eq('user_id', assignment.user_id)
                .eq('title', `Assignment Due ${timeText}`)
                .eq('related_id', assignment.id)
                .gte('created_at', new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString())
                .maybeSingle();

              if (!existingNotification) {
                // Send push notifications
                for (const token of userTokenList) {
                  await this.push.sendSmart(token, `Assignment Due ${timeText}!`, `"${assignment.title}" is due ${timeText}`, { 
                    type: 'assignment', 
                    id: assignment.id, 
                    hoursAhead: String(hoursAhead)
                  });
                }
                
                // Create notification record
                await this.supabase.admin.from('notifications').insert({
                  user_id: assignment.user_id,
                  title: `Assignment Due ${timeText}`,
                  body: `"${assignment.title}" is due ${timeText}`,
                  type: 'reminder',
                  category: 'assignment',
                  is_read: false,
                  related_id: assignment.id,
                  related_type: 'assignment',
                  metadata: { hoursAhead }
                });
                
                results.push({ type: 'assignment', id: assignment.id, user_id: assignment.user_id, hoursAhead });
              }
            }
          }
        }

        // Check for tests starting in this time window
        const { data: upcomingTests } = await this.supabase.admin
          .from('tests')
          .select('id, title, user_id, date, time')
          .in('user_id', userIds)
          .gte('date', today)
          .lte('date', futureDate);

        if (upcomingTests?.length) {
          for (const test of upcomingTests) {
            const userTokenList = userTokens.get(test.user_id);
            if (userTokenList) {
              const { data: settings } = await this.supabase.admin
                .from('settings')
                .select('notifications_enabled')
                .eq('user_id', test.user_id)
                .single();

              if (!settings?.notifications_enabled) {
                continue;
              }

              const timeText = hoursAhead >= 24 ? `in ${hoursAhead} hours` : 
                              hoursAhead >= 1 ? `in ${hoursAhead} hour${hoursAhead > 1 ? 's' : ''}` : 
                              'very soon';

              const { data: existingNotification } = await this.supabase.admin
                .from('notifications')
                .select('id')
                .eq('user_id', test.user_id)
                .eq('title', `Test Starting ${timeText}`)
                .eq('related_id', test.id)
                .gte('created_at', new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString())
                .maybeSingle();

              if (!existingNotification) {
                for (const token of userTokenList) {
                  await this.push.sendSmart(token, `Test Starting ${timeText}`, `"${test.title}" starts at ${test.time} (${timeText})`, { 
                    type: 'test', 
                    id: test.id, 
                    hoursAhead: String(hoursAhead)
                  });
                }

                await this.supabase.admin.from('notifications').insert({
                  user_id: test.user_id,
                  title: `Test Starting ${timeText}`,
                  body: `"${test.title}" starts at ${test.time}`,
                  type: 'reminder',
                  category: 'test',
                  is_read: false,
                  related_id: test.id,
                  related_type: 'test',
                  metadata: { hoursAhead }
                });

                results.push({ type: 'test', id: test.id, user_id: test.user_id, hoursAhead });
              }
            }
          }
        }

        // Check for exams starting in this time window
        const { data: upcomingExams } = await this.supabase.admin
          .from('exams')
          .select('id, title, user_id, date, time')
          .in('user_id', userIds)
          .gte('date', today)
          .lte('date', futureDate);

        if (upcomingExams?.length) {
          for (const exam of upcomingExams) {
            const userTokenList = userTokens.get(exam.user_id);
            if (userTokenList) {
              const { data: settings } = await this.supabase.admin
                .from('settings')
                .select('notifications_enabled')
                .eq('user_id', exam.user_id)
                .single();

              if (!settings?.notifications_enabled) {
                continue;
              }

              const timeText = hoursAhead >= 24 ? `in ${hoursAhead} hours` : 
                              hoursAhead >= 1 ? `in ${hoursAhead} hour${hoursAhead > 1 ? 's' : ''}` : 
                              'very soon';

              const { data: existingNotification } = await this.supabase.admin
                .from('notifications')
                .select('id')
                .eq('user_id', exam.user_id)
                .eq('title', `Exam Starting ${timeText}`)
                .eq('related_id', exam.id)
                .gte('created_at', new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString())
                .maybeSingle();

              if (!existingNotification) {
                for (const token of userTokenList) {
                  await this.push.sendSmart(token, `Exam Starting ${timeText}`, `"${exam.title}" starts at ${exam.time} (${timeText})`, { 
                    type: 'exam', 
                    id: exam.id, 
                    hoursAhead: String(hoursAhead)
                  });
                }

                await this.supabase.admin.from('notifications').insert({
                  user_id: exam.user_id,
                  title: `Exam Starting ${timeText}`,
                  body: `"${exam.title}" starts at ${exam.time}`,
                  type: 'reminder',
                  category: 'exam',
                  is_read: false,
                  related_id: exam.id,
                  related_type: 'exam',
                  metadata: { hoursAhead }
                });

                results.push({ type: 'exam', id: exam.id, user_id: exam.user_id, hoursAhead });
              }
            }
          }
        }
      }

      // Check for overdue assignments
      const { data: overdueAssignments } = await this.supabase.admin
        .from('assignments')
        .select('id, title, user_id, deadline_date')
        .in('user_id', userIds)
        .lt('deadline_date', today);

      if (overdueAssignments?.length) {
        for (const assignment of overdueAssignments) {
          const userTokenList = userTokens.get(assignment.user_id);
          if (userTokenList) {
            const { data: settings } = await this.supabase.admin
              .from('settings')
              .select('notifications_enabled')
              .eq('user_id', assignment.user_id)
              .single();

            if (!settings?.notifications_enabled) {
              continue;
            }

            const { data: existingNotification } = await this.supabase.admin
              .from('notifications')
              .select('id')
              .eq('user_id', assignment.user_id)
              .eq('title', 'Assignment Overdue!')
              .eq('related_id', assignment.id)
              .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existingNotification) {
              for (const token of userTokenList) {
                await this.push.sendSmart(token, 'Assignment Overdue!', `"${assignment.title}" was due on ${assignment.deadline_date}`, { 
                  type: 'assignment', 
                  id: assignment.id, 
                  overdue: 'true' 
                });
              }

              await this.supabase.admin.from('notifications').insert({
                user_id: assignment.user_id,
                title: 'Assignment Overdue!',
                body: `"${assignment.title}" was due on ${assignment.deadline_date}`,
                type: 'reminder',
                category: 'assignment',
                is_read: false,
                related_id: assignment.id,
                related_type: 'assignment',
                metadata: { overdue: true }
              });

              results.push({ type: 'assignment', id: assignment.id, user_id: assignment.user_id, overdue: true });
            }
          }
        }
      }

      return {
        message: 'Reminders sent successfully',
        sent: results.length,
        details: results,
        success: true,
      };
    } catch (error: any) {
      return {
        message: 'Failed to send reminders',
        error: error.message,
        sent: 0,
        success: false,
      };
    }
  }

  @Get('check')
  @ApiOperation({ summary: 'Check for due reminders for current user' })
  async checkReminders(@Req() req: any) {
    const now = new Date();
    const userId = req.user?.id; // Get from auth middleware
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const reminders: any[] = [];

    // Check for assignments due in next 2 hours
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const today = now.toISOString().split('T')[0];
    
    const { data: upcomingAssignments } = await this.supabase.admin
      .from('assignments')
      .select('id, title, user_id, deadline_date, deadline_time')
      .eq('user_id', userId)
      .gte('deadline_date', today)
      .lte('deadline_date', today);

    if (upcomingAssignments?.length) {
      for (const assignment of upcomingAssignments) {
        const deadline = new Date(`${assignment.deadline_date}T${assignment.deadline_time || '23:59'}`);
        const hoursUntilDue = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilDue <= 2 && hoursUntilDue > 0) {
          reminders.push({
            type: 'assignment',
            id: assignment.id,
            title: 'Assignment Due Soon!',
            body: `"${assignment.title}" is due in ${Math.round(hoursUntilDue)} hour(s)`,
            data: { type: 'assignment', id: assignment.id },
          });
        }
      }
    }

    // Check for tests/exams starting in next 2 hours
    const { data: upcomingTests } = await this.supabase.admin
      .from('tests')
      .select('id, title, user_id, date, time')
      .eq('user_id', userId)
      .eq('date', today)
      .lte('time', twoHoursLater.toTimeString().split(' ')[0]);

    if (upcomingTests?.length) {
      for (const test of upcomingTests) {
        const testTime = new Date(`${test.date}T${test.time}`);
        const hoursUntilTest = (testTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilTest <= 2 && hoursUntilTest > 0) {
          reminders.push({
            type: 'test',
            id: test.id,
            title: 'Test Starting Soon!',
            body: `"${test.title}" starts in ${Math.round(hoursUntilTest)} hour(s)`,
            data: { type: 'test', id: test.id },
          });
        }
      }
    }

    const { data: upcomingExams } = await this.supabase.admin
      .from('exams')
      .select('id, title, user_id, date, time')
      .eq('user_id', userId)
      .eq('date', today)
      .lte('time', twoHoursLater.toTimeString().split(' ')[0]);

    if (upcomingExams?.length) {
      for (const exam of upcomingExams) {
        const examTime = new Date(`${exam.date}T${exam.time}`);
        const hoursUntilExam = (examTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilExam <= 2 && hoursUntilExam > 0) {
          reminders.push({
            type: 'exam',
            id: exam.id,
            title: 'Exam Starting Soon!',
            body: `"${exam.title}" starts in ${Math.round(hoursUntilExam)} hour(s)`,
            data: { type: 'exam', id: exam.id },
          });
        }
      }
    }

    return reminders;
  }

  @Post('test')
  @ApiOperation({ summary: 'Test push notification for current user' })
  async testNotification() {
    // This would be called with user authentication
    return { message: 'Test endpoint - implement with auth guard' };
  }

  private async sendPushNotification(tokens: string[], message: { title: string; body: string; data: any }) {
    // Use Firebase Admin SDK or Expo Push API
    // For now, we'll use Expo Push API
    const expoPushMessages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data,
    }));

    // Send via Expo Push API
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoPushMessages),
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return null;
    }
  }
}