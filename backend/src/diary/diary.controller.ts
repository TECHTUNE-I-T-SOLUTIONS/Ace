import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DiaryService } from './diary.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('diary')
@UseGuards(JwtAuthGuard)
export class DiaryController {
  constructor(
    private readonly service: DiaryService,
    private readonly notifications: NotificationsService,
  ) {}
  @Get() list(@Req() req: any) { return this.service.list(req.user.sub); }
  @Get(':id') get(@Req() req: any, @Param('id') id: string) { return this.service.get(id, req.user.sub); }
  @Post() async create(@Req() req: any, @Body() body: any) { 
    const result = await this.service.create(req.user.sub, body);
    // Send push notification for diary entry creation
    await this.notifications.sendItemCreatedNotification(req.user.sub, 'diary entry', body.title || 'New Diary Entry');
    return result;
  }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.service.update(id, req.user.sub, body); }
  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) { return this.service.remove(id, req.user.sub); }
}
