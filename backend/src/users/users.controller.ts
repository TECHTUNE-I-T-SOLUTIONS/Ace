import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UsersService } from './users.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get('me')
  async me(@Req() req: any) {
    const result = await this.users.me(req.user.sub);
    // Send login notification
    await this.notifications.sendLoginNotification(req.user.sub);
    return result;
  }

  @Patch('me')
  updateMe(@Req() req: any, @Body() body: any) {
    return this.users.updateMe(req.user.sub, body);
  }
}
