import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}
  @Get() get(@Req() req: any) { return this.service.get(req.user.sub); }
  @Patch() update(@Req() req: any, @Body() body: any) { return this.service.update(req.user.sub, body); }
}
