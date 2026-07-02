import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags('reminders')
@Controller('reminders')
export class RemindersController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get('cron')
  @ApiOperation({ summary: 'Cron endpoint - sends push notifications for upcoming events' })
  async sendReminders() {
    const now = new Date();
    const results: any[] = [];

    // Get all users with push tokens
    const { data: tokens, error: tokensError } = await this.supabase.admin
      .from('push_notification_tokens')
      .select('user_id, token');

    if (tokensError || !tokens?.length) {
      return { message: 'No push tokens found', sent: 0 };
    }

    // Group tokens by user
    const userTokens = new Map<string, string[]>();
    tokens.forEach(({ user_id, token }) => {
      const existing = userTokens.get(user_id) || [];
      existing.push(token);
      userTokens.set(user_id, existing);
    });

    // Check for assignments due in next 24 hours (check every 6 hours: 24h, 18h, 12h, 6h, 3h, 1h)
    const notificationWindows = [24, 18, 12, 6, 3, 1];
    const today = now.toISOString().split('T')[0];
    
    for (const hoursAhead of notificationWindows) {
      const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      const futureDate = futureTime.toISOString().split('T')[0];
      
      // Get assignments due in this time window
      const { data: upcomingAssignments } = await this.supabase.admin
        .from('assignments')
        .select('id, title, user_id, deadline_date, deadline_time')
        .eq('user_id', userTokens.keys().next().value) // This will be filtered per user
        .gte('deadline_date', today)
        .lte('deadline_date', futureDate);

      if (upcomingAssignments?.length) {
        for (const assignment of upcomingAssignments) {
          const userTokenList = userTokens.get(assignment.user_id);
          if (userTokenList) {
            const timeText = hoursAhead >= 24 ? `in ${hoursAhead} hours` : 
                            hoursAhead >= 1 ? `in ${hoursAhead} hour${hoursAhead > 1 ? 's' : ''}` : 
                            'very soon';
            
            // Check if already notified for this window
            const { data: existingNotification } = await this.supabase.admin
              .from('notifications')
              .select('id')
              .eq('user_id', assignment.user_id)
              .eq('title', `Assignment Due ${timeText}`)
              .eq('data->>assignment_id', assignment.id)
              .gte('created_at', new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existingNotification) {
              await this.sendPushNotification(userTokenList, {
                title: `Assignment Due ${timeText}!`,
                body: `"${assignment.title}" is due ${timeText}`,
                data: { type: 'assignment', id: assignment.id, hoursAhead },
              });
              
              // Create notification record
              await this.supabase.admin.from('notifications').insert({
                user_id: assignment.user_id,
                title: `Assignment Due ${timeText}`,
                body: `"${assignment.title}" is due ${timeText}`,
                type: 'assignment',
                is_read: false,
                data: { assignment_id: assignment.id, hoursAhead }
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
        .eq('date', today)
        .lte('time', futureTime.toTimeString().split(' ')[0]);

      if (upcomingTests?.length) {
        for (const test of upcomingTests) {
          const userTokenList = userTokens.get(test.user_id);
          if (userTokenList) {
            const timeText = hoursAhead >= 24 ? `in ${hoursAhead} hours` : 
                            hoursAhead >= 1 ? `in ${hoursAhead} hour${hoursAhead > 1 ? 's' : ''}` : 
                            'very soon';

            const { data: existingNotification } = await this.supabase.admin
              .from('notifications')
              .select('id')
              .eq('user_id', test.user_id)
              .eq('title', `Test Starting ${timeText}`)
              .eq('data->>test_id', test.id)
              .gte('created_at', new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existingNotification) {
              await this.sendPushNotification(userTokenList, {
                title: `Test Starting ${timeText}`,
                body: `"${test.title}" starts at ${test.time} (${timeText})`,
                data: { type: 'test', id: test.id, hoursAhead },
              });

              await this.supabase.admin.from('notifications').insert({
                user_id: test.user_id,
                title: `Test Starting ${timeText}`,
                body: `"${test.title}" starts at ${test.time}`,
                type: 'test',
                is_read: false,
                data: { test_id: test.id, hoursAhead }
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
        .eq('date', today)
        .lte('time', futureTime.toTimeString().split(' ')[0]);

      if (upcomingExams?.length) {
        for (const exam of upcomingExams) {
          const userTokenList = userTokens.get(exam.user_id);
          if (userTokenList) {
            const timeText = hoursAhead >= 24 ? `in ${hoursAhead} hours` : 
                            hoursAhead >= 1 ? `in ${hoursAhead} hour${hoursAhead > 1 ? 's' : ''}` : 
                            'very soon';

            const { data: existingNotification } = await this.supabase.admin
              .from('notifications')
              .select('id')
              .eq('user_id', exam.user_id)
              .eq('title', `Exam Starting ${timeText}`)
              .eq('data->>exam_id', exam.id)
              .gte('created_at', new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existingNotification) {
              await this.sendPushNotification(userTokenList, {
                title: `Exam Starting ${timeText}`,
                body: `"${exam.title}" starts at ${exam.time} (${timeText})`,
                data: { type: 'exam', id: exam.id, hoursAhead },
              });

              await this.supabase.admin.from('notifications').insert({
                user_id: exam.user_id,
                title: `Exam Starting ${timeText}`,
                body: `"${exam.title}" starts at ${exam.time}`,
                type: 'exam',
                is_read: false,
                data: { exam_id: exam.id, hoursAhead }
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
      .lt('deadline_date', today);

    if (overdueAssignments?.length) {
      for (const assignment of overdueAssignments) {
        const userTokenList = userTokens.get(assignment.user_id);
        if (userTokenList) {
          const { data: existingNotification } = await this.supabase.admin
            .from('notifications')
            .select('id')
            .eq('user_id', assignment.user_id)
            .eq('title', 'Assignment Overdue!')
            .eq('data->>assignment_id', assignment.id)
            .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (!existingNotification) {
            await this.sendPushNotification(userTokenList, {
              title: 'Assignment Overdue!',
              body: `"${assignment.title}" was due on ${assignment.deadline_date}`,
              data: { type: 'assignment', id: assignment.id, overdue: true },
            });

            await this.supabase.admin.from('notifications').insert({
              user_id: assignment.user_id,
              title: 'Assignment Overdue!',
              body: `"${assignment.title}" was due on ${assignment.deadline_date}`,
              type: 'assignment',
              is_read: false,
              data: { assignment_id: assignment.id, overdue: true }
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
    };
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