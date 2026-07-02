import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './common/health.controller';
import { DetailsController } from './common/details.controller';
import { PrismaService } from './database/prisma.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DiaryModule } from './diary/diary.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { CoursesModule } from './courses/courses.module';
import { GradesModule } from './grades/grades.module';
import { ExamsModule } from './exams/exams.module';
import { CalendarModule } from './calendar/calendar.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RemindersController } from './notifications/reminders.controller';
import { NotesModule } from './notes/notes.module';
import { SettingsModule } from './settings/settings.module';
import { SearchModule } from './search/search.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { TestsModule } from './tests/tests.module';
import { StudySessionsModule } from './study-sessions/study-sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    AssignmentsModule,
    TestsModule,
    ExamsModule,
    TasksModule,
    AnalyticsModule,
    StudySessionsModule,
    DiaryModule,
    CalendarModule,
    NotesModule,
    AttendanceModule,
    GradesModule,
    NotificationsModule,
    SettingsModule,
    AuditLogsModule,
    SearchModule,
    AiModule,
  ],
  controllers: [HealthController, DetailsController, RemindersController],
  providers: [PrismaService],
})
export class AppModule {}
