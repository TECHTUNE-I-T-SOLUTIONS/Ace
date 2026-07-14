import { Module } from '@nestjs/common';
import { StudySessionsController } from './study-sessions.controller';
import { StudySessionsService } from './study-sessions.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({ 
  imports: [NotificationsModule],
  controllers: [StudySessionsController], 
  providers: [StudySessionsService] 
})
export class StudySessionsModule {}
