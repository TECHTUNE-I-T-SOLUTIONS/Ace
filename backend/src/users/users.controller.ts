import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.users.me(req.user.sub);
  }

  @Patch('me')
  updateMe(@Req() req: any, @Body() body: any) {
    return this.users.updateMe(req.user.sub, body);
  }
}
