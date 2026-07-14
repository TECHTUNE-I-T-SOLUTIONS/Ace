import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TestsService } from './tests.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class TestsController {
  constructor(
    private readonly service: TestsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  async list(@Req() req: any) {
    return this.service.list(req.user.sub);
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const result = await this.service.create(req.user.sub, body);
    // Send push notification for test creation
    await this.notifications.sendItemCreatedNotification(req.user.sub, 'test', body.title || 'New Test');
    return result;
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(id, req.user.sub, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(id, req.user.sub);
  }
}