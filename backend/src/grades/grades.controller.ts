import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GradesService } from './grades.service';

@Controller('grades')
@UseGuards(JwtAuthGuard)
export class GradesController {
  constructor(private readonly service: GradesService) {}
  @Get() list(@Req() req: any) { return this.service.list(req.user.sub); }
  @Get('courses') getCourses(@Req() req: any) { return this.service.getCourses(req.user.sub); }
  @Post() create(@Req() req: any, @Body() body: any) { return this.service.create(req.user.sub, body); }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.service.update(id, req.user.sub, body); }
  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) { return this.service.remove(id, req.user.sub); }
}
