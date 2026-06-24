# ACE Project Report

## 1. Project Overview

ACE is an academic companion app designed to help students organize lectures, assignments, tests, exams, study sessions, tasks, notes, diary entries, attendance, grades, and reminders in one polished mobile experience.

The project is built as a full-stack system:

- Mobile app: Expo + React Native
- Backend API: NestJS
- Database and auth: Supabase
- AI assistant: Gemini

## 2. Project Goals

The main goals of ACE are:

- Make academic planning simple and visually clean
- Reduce missed deadlines and forgotten lectures
- Help students track progress and productivity
- Provide AI-generated study help using personal academic context
- Keep the system scalable and production ready

## 3. Tech Stack

### Mobile

- Expo
- React Native
- Expo Router
- TypeScript

### Backend

- NestJS
- TypeScript
- Supabase Admin client
- JWT verification with Supabase JWKS

### Database and Auth

- Supabase Auth
- PostgreSQL
- Row Level Security
- Supabase Storage

### AI

- Gemini API
- Context-aware prompt generation
- Fallback model chain

## 4. Design Direction

The mobile UI follows the supplied mockups closely:

- dark navy backgrounds
- vivid blue accents
- rounded cards
- soft gradients
- clean spacing
- mobile-first layout

The goal was a polished interface that feels modern and professional, with Flutter-like smoothness in presentation.

## 5. App Structure

### Onboarding

- Splash screen
- Onboarding carousel
- Welcome/login entry points

### Authentication

- Login
- Register
- Forgot password
- Email verification
- Profile setup

### Main Tabs

- Dashboard
- Calendar
- Tasks
- Diary
- Profile

### Functional Screens

- Courses
- Assignments
- Tests
- Exams
- Notes
- Attendance
- Grades
- Notifications
- Settings
- Audit Logs
- Search
- AI Assistant

## 6. Core Features

### Courses

Students can view and manage course records such as course code, title, lecturer, venue, schedule, and session data.

### Assignments

Assignments include title, description, deadline, priority, completion status, and attachments.

### Tests and Exams

Test and exam screens support upcoming academic event tracking and countdown-style planning.

### Notes

Notes support rich academic text, search, and file/image attachments uploaded to Supabase Storage.

### Diary

Diary entries help students capture personal reflections and productivity notes.

### Attendance

Attendance records track classes held, classes attended, and attendance percentage.

### Grades

Grades support course results, semester tracking, credit units, and GPA-oriented records.

### Notifications

Notifications are stored in the database and can be marked as read.

### Analytics

The analytics layer summarizes academic counts and performance snapshots.

### Search

Global search looks across academic data and content notes.

### AI Assistant

The assistant can answer questions about:

- what to study
- upcoming deadlines
- study plan generation
- exam preparation
- productivity guidance

It uses the student’s own academic context before calling Gemini.

## 7. Backend API

The NestJS backend exposes REST endpoints for:

- authentication-aware user data
- CRUD for core academic entities
- analytics
- calendar agenda
- search
- AI chat
- audit log access

### Example API Groups

- `/users`
- `/courses`
- `/assignments`
- `/tests`
- `/exams`
- `/tasks`
- `/notes`
- `/attendance`
- `/grades`
- `/notifications`
- `/settings`
- `/search`
- `/analytics`
- `/calendar`
- `/ai`

## 8. Database Design

The database includes:

- `profiles`
- `courses`
- `assignments`
- `tests`
- `exams`
- `study_sessions`
- `tasks`
- `notes`
- `diary_entries`
- `attendance_records`
- `grades`
- `notifications`
- `ai_conversations`
- `analytics_snapshots`
- `settings`
- `audit_logs`

Additional support includes:

- triggers
- updated timestamps
- audit logging
- auth-linked profile creation
- RLS policies
- storage bucket policies

## 9. Supabase Storage

Storage is used for:

- note attachments
- profile images

Buckets:

- `attachments`
- `avatars`

## 10. AI Design

The Gemini integration uses a fallback chain:

1. `gemini-3.5-flash`
2. `gemini-3.1-flash-lite`
3. `gemini-3-flash-preview`
4. `gemini-2.5-pro`
5. `gemini-2.5-flash`
6. `gemini-2.5-flash-lite`
7. `gemini-2.5-flash-lite-preview-09-2025`

The assistant builds prompts from:

- profile data
- dashboard counts
- notes
- tasks
- deadlines

## 11. Security

Security measures include:

- Supabase auth sessions
- JWT verification in NestJS
- RLS on all user-owned tables
- storage policies for private ownership
- service-role-only backend access

## 12. Deployment Considerations

Before launch:

- ensure environment variables are set
- confirm Supabase buckets exist
- apply migrations
- seed launch data if desired
- configure backend deployment
- configure mobile API base URL

## 13. Command Summary

### Mobile

```bash
npm install
npm start
```

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Supabase

```bash
npm run supabase:login
npm run supabase:link
npm run supabase:db:push
```

## 14. Current Status

The project now has:

- a production-style mobile shell
- live API-backed screens
- backend REST modules
- Supabase auth integration
- Supabase storage handling
- AI assistant support
- seed and migration files
- launch documentation

This makes ACE suitable for development, testing, reporting, and demoing as a full-stack student productivity platform.
