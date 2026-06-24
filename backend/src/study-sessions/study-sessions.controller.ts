import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { StudySessionsService } from './study-sessions.service';

@Controller('study-sessions')
@UseGuards(JwtAuthGuard)
export class StudySessionsController {
  constructor(private readonly service: StudySessionsService) {}
  @Get() list(@Req() req: any) { return this.service.list(req.user.sub); }
}
