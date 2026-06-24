# ACE

ACE stands for Academic Companion & Efficiency. It is a production-oriented academic scheduling and student productivity platform built as a monorepo:

- Expo and React Native mobile app at the repo root
- NestJS backend API in `backend/`
- Supabase for authentication, storage, and database access
- Gemini for AI academic assistance

## Repository Layout

- `app/` - Expo Router screens
- `src/` - shared UI, API helpers, storage helpers, and types
- `assets/` - mobile app static assets
- `backend/` - NestJS API server, migrations, and seed files
- `supabase/` - root Supabase resources used by the app side

## What ACE Does

ACE helps students manage:

- Courses
- Assignments
- Tests
- Exams
- Study sessions
- Tasks
- Notes
- Diary entries
- Attendance
- Grades
- Notifications
- Academic analytics
- AI study assistance

## Main App Areas

### Onboarding and Authentication

- Splash screen
- Onboarding carousel
- Login
- Register
- Forgot password
- Email verification
- Profile setup

### Core Tabs

- Dashboard
- Calendar
- Tasks
- Diary
- Profile

### Feature Screens

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

## Architecture

### Mobile App

The mobile app uses Expo Router for navigation and a shared dark, gradient-heavy visual system inspired by the supplied design mockups.

Key parts:

- `app/` contains the route-based screens
- `src/` contains reusable UI, API helpers, storage helpers, and shared types
- `src/lib/supabase.ts` handles Supabase auth/session persistence
- `src/api.ts` and `src/api-hooks.ts` handle API communication and CRUD flows

### Backend

The backend is a NestJS app that exposes REST endpoints for the mobile app and verifies Supabase JWTs using the Supabase JWKS endpoint.

Core modules include:

- Auth
- Users
- Courses
- Assignments
- Tests
- Exams
- Tasks
- Notes
- Attendance
- Grades
- Notifications
- Settings
- Search
- Analytics
- Calendar
- AI
- Audit logs

## Database

The project includes Supabase/Postgres migrations for:

- auth-linked profiles
- academic entities
- reminders and notifications
- analytics snapshots
- AI conversations
- audit logs
- storage buckets and policies

## Storage

Supabase Storage is used for:

- note attachments
- profile pictures

Buckets:

- `attachments`
- `avatars`

## AI

The AI assistant uses Gemini and automatically gathers student context before answering.

Fallback models are configured in order:

- `gemini-3.5-flash`
- `gemini-3.1-flash-lite`
- `gemini-3-flash-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-2.5-flash-lite`
- `gemini-2.5-flash-lite-preview-09-2025`

The assistant supports saved threads and conversation history.

## Supabase CLI

Useful scripts:

- `npm run supabase:login`
- `npm run supabase:link`
- `npm run supabase:migration:new`
- `npm run supabase:db:push`
- `npm run supabase:db:pull`
- `npm run supabase:db:reset`

## Local Development

Install dependencies:

```bash
npm install
cd backend
npm install
```

Run the app:

```bash
npm start
```

Run the backend:

```bash
cd backend
npm run start:dev
```

## Deployment

### Expo / EAS

Build the mobile app from the repository root. Keep Expo configuration at the root so EAS can consume the app without the backend folder.

### Northflank

Deploy the backend from the `backend/` folder. Set the working directory to `backend` and use the NestJS start command from `backend/package.json`.

Recommended backend build/start flow:

- install dependencies in `backend/`
- run `npm run build`
- run `npm run start`

### GitHub Monorepo

This repo is designed to host both apps together:

- Expo app at the root for EAS
- NestJS server in `backend/` for Northflank

## Environment Variables

See:

- `.env.local`
- `backend/.env.local`

Important values include:

- Supabase project URL
- Supabase publishable key
- Supabase secret/service key
- Supabase JWKS URL
- Gemini API key
- API base URL
