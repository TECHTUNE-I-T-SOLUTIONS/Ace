import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}
  @Get() list(@Req() req: any) { return this.service.list(req.user.sub); }
  @Post() create(@Req() req: any, @Body() body: any) { return this.service.create(req.user.sub, body); }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.service.update(id, req.user.sub, body); }
}
