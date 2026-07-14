import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StudySessionsService } from './study-sessions.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('study-sessions')
@UseGuards(JwtAuthGuard)
export class StudySessionsController {
  constructor(
    private readonly service: StudySessionsService,
    private readonly notifications: NotificationsService,
  ) {}
  @Get() list(@Req() req: any) { return this.service.list(req.user.sub); }
  
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const result = await this.service.create(req.user.sub, body);
    // Send push notification for study session creation
    await this.notifications.sendItemCreatedNotification(req.user.sub, 'study session', body.subject || 'New Study Session');
    return result;
  }
}
