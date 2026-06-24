export type Id = string;

export interface UserProfile {
  id: Id;
  fullName: string;
  email: string;
  role: 'student' | 'administrator' | 'super_administrator';
  avatarUrl?: string | null;
  institution?: string | null;
  department?: string | null;
  level?: string | null;
}

export interface Course {
  id: Id;
  courseCode: string;
  courseTitle: string;
  lecturerName?: string | null;
  lecturerPhone?: string | null;
  lecturerEmail?: string | null;
  venue?: string | null;
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  creditUnit?: number | null;
  semester?: string | null;
  academicSession?: string | null;
}

export interface Assignment {
  id: Id;
  title: string;
  description?: string | null;
  courseId: Id;
  priority: 'low' | 'medium' | 'high';
  deadlineDate: string;
  deadlineTime?: string | null;
  status: 'pending' | 'completed';
  attachments?: string[];
}

export interface TestItem {
  id: Id;
  title: string;
  courseId: Id;
  date: string;
  time?: string | null;
  venue?: string | null;
  notes?: string | null;
}

export interface Exam {
  id: Id;
  title: string;
  courseId: Id;
  date: string;
  time?: string | null;
  venue?: string | null;
  seatInfo?: string | null;
  notes?: string | null;
}

export interface StudySession {
  id: Id;
  subject: string;
  goal: string;
  location?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  completionStatus: 'planned' | 'in_progress' | 'completed';
}

export interface TaskItem {
  id: Id;
  title: string;
  description?: string | null;
  category: 'academic' | 'personal' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'doing' | 'done';
}

export interface DiaryEntry {
  id: Id;
  title: string;
  content: string;
  mood: 'happy' | 'focused' | 'stressed' | 'neutral';
  createdAt: string;
}

export interface AnalyticsSnapshot {
  id: Id;
  studyHours: number;
  attendanceRate: number;
  assignmentsCompleted: number;
  upcomingDeadlines: number;
  productivityScore: number;
  streakDays: number;
}
