import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DiaryService } from './diary.service';

@Controller('diary')
@UseGuards(JwtAuthGuard)
export class DiaryController {
  constructor(private readonly service: DiaryService) {}
  @Get() list(@Req() req: any) { return this.service.list(req.user.sub); }
  @Post() create(@Req() req: any, @Body() body: any) { return this.service.create(req.user.sub, body); }
}
