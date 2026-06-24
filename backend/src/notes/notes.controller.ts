import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotesService } from './notes.service';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly service: NotesService) {}
  @Get() list(@Req() req: any, @Query() query: any) { return this.service.list(req.user.sub, query); }
  @Get('search') search(@Req() req: any, @Query('q') q: string) { return this.service.search(req.user.sub, q ?? ''); }
  @Post() create(@Req() req: any, @Body() body: any) { return this.service.create(req.user.sub, body); }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.service.update(id, req.user.sub, body); }
  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) { return this.service.remove(id, req.user.sub); }
}
