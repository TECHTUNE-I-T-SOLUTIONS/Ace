import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
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
  registerPushToken(
    @Req() req: any,
    @Body() body: { token: string; platform?: string },
  ) {
    return this.service.upsertPushToken(
      req.user.sub,
      body.token,
      body.platform ?? 'android',
    );
  }

  @Post('run-deadline-reminders')
  runDeadlineReminders() {
    return this.service.runDeadlineReminders();
  }
}