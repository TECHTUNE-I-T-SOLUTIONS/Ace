import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({ 
  imports: [NotificationsModule],
  controllers: [DiaryController], 
  providers: [DiaryService] 
})
export class DiaryModule {}
