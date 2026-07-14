import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CoursesService } from './courses.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(
    private readonly service: CoursesService,
    private readonly notifications: NotificationsService,
  ) {}
  @Get() list(@Req() req: any, @Query() query: any) { return this.service.list(req.user.sub, query); }
  @Post() async create(@Req() req: any, @Body() body: any) { 
    const result = await this.service.create(req.user.sub, body);
    // Send push notification for course creation
    await this.notifications.sendItemCreatedNotification(req.user.sub, 'course', body.course_title || body.title || 'New Course');
    return result;
  }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.service.update(id, req.user.sub, body); }
  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) { return this.service.remove(id, req.user.sub); }
}
