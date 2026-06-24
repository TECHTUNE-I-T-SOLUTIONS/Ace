import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly service: AiService) {}
  @Post('chat') async chat(@Req() req: any, @Body() body: { message: string; threadId?: string; title?: string }) {
    const result = await this.service.chat(req.user.sub, body.message);
    const previous = body.threadId ? await this.service.thread(req.user.sub, body.threadId) : null;
    const messages = [...(previous?.messages ?? []), { role: 'user', content: body.message }, { role: 'assistant', content: result.text, model: result.model }];
    const saved = await this.service.saveThread(req.user.sub, body.threadId ?? null, body.title ?? previous?.title ?? body.message.slice(0, 32), messages, result.text);
    return { ...result, thread: saved };
  }
  @Get('threads') threads(@Req() req: any) { return this.service.threads(req.user.sub); }
  @Get('threads/:id') thread(@Req() req: any, @Param('id') id: string) { return this.service.thread(req.user.sub, id); }
  @Post('threads/:id/archive') archive(@Req() req: any, @Param('id') id: string) { return this.service.archiveThread(req.user.sub, id); }
  @Post('threads/:id/delete') delete(@Req() req: any, @Param('id') id: string) { return this.service.deleteThread(req.user.sub, id); }
}
