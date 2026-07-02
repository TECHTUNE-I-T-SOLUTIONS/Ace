import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags('details')
@Controller('details')
export class DetailsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Get details for any item by type and ID' })
  @ApiQuery({ name: 'type', enum: ['course', 'assignment', 'test', 'exam', 'task', 'grade', 'attendance', 'note', 'study', 'diary'] })
  @ApiQuery({ name: 'id', type: String })
  async getDetails(@Query('type') type: string, @Query('id') id: string) {
    const tableMap: Record<string, string> = {
      course: 'courses',
      assignment: 'assignments',
      test: 'tests',
      exam: 'exams',
      task: 'tasks',
      grade: 'grades',
      attendance: 'attendance_records',
      note: 'notes',
      study: 'study_sessions',
      diary: 'diary_entries',
    };

    const table = tableMap[type];
    if (!table) {
      throw new Error('Invalid type');
    }

    const { data, error } = await this.supabase.admin
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}