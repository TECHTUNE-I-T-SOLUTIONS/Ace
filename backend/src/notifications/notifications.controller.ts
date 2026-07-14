import { Body, Controller, Get, Logger, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.sub);
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.service.getUnreadCount(req.user.sub);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(id, req.user.sub, body);
  }

  @Post('mark-all-read')
  markAllRead(@Req() req: any) {
    return this.service.markAllRead(req.user.sub);
  }

  @Post('push-token')
  async registerPushToken(
    @Req() req: any,
    @Body() body: { token: string; platform?: string },
  ) {
    this.logger.log(`Registering push token for user ${req.user.sub}: ${body.token.substring(0, 20)}...`);
    
    const result = await this.service.upsertPushToken(
      req.user.sub,
      body.token,
      body.platform ?? 'android',
    );
    
    this.logger.log(`Push token registered successfully for user ${req.user.sub}`);
    
    return { success: true, data: result };
  }

  @Post('test-push')
  async testPushNotification(@Req() req: any) {
    return await this.service.sendTestNotificationToUser(req.user.sub);
  }

  @Post('run-deadline-reminders')
  runDeadlineReminders() {
    return this.service.runDeadlineReminders();
  }
}