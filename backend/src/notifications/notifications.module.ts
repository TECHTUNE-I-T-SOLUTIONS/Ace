import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { RemindersController } from './reminders.controller';

@Module({
  controllers: [NotificationsController, RemindersController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}