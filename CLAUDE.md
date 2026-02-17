# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UpEvents is an event management application with a **React + Vite frontend** and an **Express + MySQL backend**. It provides end-to-end event management including registration, attendance tracking via QR codes, and a gamification system to engage participants.

## Architecture

### Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Express.js, TypeScript, MySQL
- **Database:** MySQL (previously Supabase/PostgreSQL)
- **Deployment:** O2Switch with Phusion Passenger

### Project Structure

```
upevents/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/           # API client, utilities, types
│   │   └── App.tsx        # Main app with hash routing
│   ├── package.json
│   └── vite.config.ts
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── db/            # Database connection and schema
│   │   └── index.ts       # Express app entry point
│   ├── package.json
│   └── tsconfig.json
├── passenger_app.cjs      # Phusion Passenger entry point (O2Switch)
└── package.json           # Root scripts for monorepo
```

## Development Commands

```bash
# Start both frontend and backend in development mode
pnpm dev

# Start backend only
pnpm dev:backend

# Start frontend only
pnpm dev:frontend

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Setup

### Backend (.env in backend/)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Password123@!
DB_NAME=upevents

PORT=3001
NODE_ENV=development

FRONTEND_URL=http://localhost:5173
```

### Frontend (.env in frontend/)
```
VITE_API_URL=http://localhost:3001/api
```

## Frontend Architecture

### Routing System
The app uses a **custom routing system** with History API (no React Router, no hash in URL). Routes are managed via React Context in `App.tsx`:
- `/` - Dashboard (event list)
- `/create` - Create new event
- `/categories` - Manage event categories
- `/program` or `/program/{eventId}` - Program/schedule builder
- `/event/{eventId}` - Event details
- `/register/{registrationCode}` - Public registration form
- `/attendance/{attendanceCode}` - Public attendance scanner
- `/leaderboard` - Gamification leaderboard

Navigation is done via the `useNavigate()` hook exported from `App.tsx`. Components call `navigate('path')` to change routes.

### Components (`frontend/src/components/`)
- `Dashboard.tsx` - Main event listing with filters
- `CreateEvent.tsx` - Event creation form
- `EventDetail.tsx` - Single event view with registrations and management
- `RegisterForm.tsx` - Public-facing registration page
- `AttendanceScanner.tsx` - QR code scanning for check-ins
- `ProgramBuilder.tsx` - Event schedule/program editor
- `CategoryManager.tsx` - Manage event categories
- `Leaderboard.tsx` - Gamification rankings
- `Sidebar.tsx` - Navigation sidebar
- `ParticipantDetailModal.tsx` - Modal showing participant history
- `TimeRangePicker.tsx` - Reusable time range input
- `Confetti.tsx` - Celebration animation for achievements

### API Client (`frontend/src/lib/api.ts`)
Centralized HTTP client for all backend communication. All API calls use this client:

```typescript
import { events, registrations, attendance } from '../lib/api';

// Example usage
const eventsList = await events.getAll();
const event = await events.getById(id);
await registrations.create({ event_id, first_name, last_name, email, company });
```

### Libraries (`frontend/src/lib/`)
- `api.ts` - HTTP client for backend API
- `database.types.ts` - TypeScript types (maintained manually)
- `gamification.ts` - Frontend constants (POINTS, LEVELS, BADGES) and helpers
- `statistics.ts` - Wrapper around statistics API calls
- `utils.ts` - General utility functions

## Backend Architecture

### API Routes (`backend/src/routes/`)

**Events (`events.ts`)**
- `GET /api/events` - List all events (query: `include_closed`)
- `GET /api/events/:id` - Get event by ID
- `GET /api/events/by-registration-code/:code` - Find event by registration code
- `GET /api/events/by-attendance-code/:code` - Find event by attendance code
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `PATCH /api/events/:id/toggle-status` - Toggle active status
- `PATCH /api/events/:id/close` - Close event

**Categories (`categories.ts`)**
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

**Registrations (`registrations.ts`)**
- `GET /api/registrations/by-event/:eventId` - Get registrations for event
- `GET /api/registrations/by-qr/:qrCode` - Find registration by QR code
- `POST /api/registrations` - Create registration
- `PUT /api/registrations/:id` - Update registration
- `PATCH /api/registrations/:id/cancel` - Cancel registration

**Attendance (`attendance.ts`)**
- `GET /api/attendance/by-registration/:regId` - Get attendance for registration
- `POST /api/attendance` - Create attendance record
- `DELETE /api/attendance/by-registration/:regId` - Delete attendance record

**Program Slots (`program-slots.ts`)**
- `GET /api/program-slots/by-event/:eventId` - Get slots for event
- `POST /api/program-slots` - Create slot
- `PUT /api/program-slots/:id` - Update slot
- `DELETE /api/program-slots/:id` - Delete slot
- `PUT /api/program-slots/batch` - Batch update all slots for an event

**Custom Fields (`custom-fields.ts`)**
- `GET /api/custom-fields/by-event/:eventId` - Get custom fields for event
- `POST /api/custom-fields` - Create custom field
- `DELETE /api/custom-fields/:id` - Delete custom field

**Registration Data (`registration-data.ts`)**
- `POST /api/registration-data/batch` - Batch create registration data

**Statistics (`statistics.ts`)**
- `GET /api/statistics/events` - Global event statistics
- `GET /api/statistics/participants` - Participant statistics
- `GET /api/statistics/participants/:email` - Detailed participant info

**Gamification (`gamification.ts`)**
- `GET /api/gamification/leaderboard` - Get leaderboard (query: `limit`)
- `GET /api/gamification/participant/:email` - Get participant profile
- `GET /api/gamification/badges/:participantId` - Get participant badges
- `POST /api/gamification/award-attendance` - Award attendance points
- `GET /api/gamification/config` - Get gamification configuration

### Services (`backend/src/services/`)

**`gamification.service.ts`**
Business logic for the gamification system:
- `getOrCreateParticipant(email, firstName, lastName)` - Get or create participant with registration points
- `awardAttendancePoints(participantId, registrationId)` - Award points and badges for attendance
- `getLevelInfo(points)` - Calculate current level and progress
- `getParticipantByEmail(email)` - Fetch participant by email
- `getParticipantBadges(participantId)` - Get earned badges
- `getLeaderboard(limit)` - Get top participants

**`statistics.service.ts`**
Business logic for statistics:
- `getEventStatistics()` - Calculate event stats (total, registrations, attendance)
- `getParticipantStatistics()` - Calculate participant stats
- `getParticipantDetails(email)` - Get detailed participant history

### Database (`backend/src/db/`)

**Connection (`connection.ts`)**
MySQL connection pool configuration using `mysql2/promise`.

**Schema (`schema.sql`)**
Complete MySQL schema with all tables. Run this to initialize the database:

```bash
mysql -u root -p upevents < backend/src/db/schema.sql
```

## Database Schema (MySQL)

**Core Tables:**
- `events` - Event details with registration_code and attendance_code
- `categories` - Event categories
- `custom_fields` - Dynamic form fields per event
- `registrations` - Participant registrations with QR codes
- `registration_data` - Values for custom fields
- `attendance` - Check-in records linked to registrations

**Gamification Tables:**
- `participants` - Aggregated participant profiles (email, points, level, streak)
- `participant_badges` - Earned badges

**Program Tables:**
- `program_slots` - Event schedule/agenda items

**Key Relationships:**
- Events → Categories (many-to-one, nullable)
- Events → Custom Fields (one-to-many)
- Events → Registrations (one-to-many)
- Events → Program Slots (one-to-many)
- Registrations → Registration Data (one-to-many)
- Registrations → Attendance (one-to-one)
- Registrations (email) → Participants (email linkage, not FK)

## Data Flow Patterns

1. **Event Creation:** CreateEvent → `POST /api/events` + `POST /api/custom-fields` (batch)
2. **Public Registration:** RegisterForm reads event by registration_code → creates registration + registration_data → backend creates/updates participant automatically
3. **Attendance:** AttendanceScanner reads registration by qr_code → creates attendance record → awards points via gamification service
4. **Statistics:** Dashboard/EventDetail query via statistics endpoints with pre-calculated aggregations

## Gamification System

Defined in `backend/src/services/gamification.service.ts`:

**Points:**
- Registration: 10 points
- Attendance: 50 points
- Early bird: 20 points
- Streak bonus: 30 points

**Levels:** 6 levels from Débutant (0 pts) to Légende (800 pts)

**Badges:** 7 badge types including First Event, Perfect Attendance, Social Butterfly, etc.

The system automatically creates/updates participant records when users register or check in via the gamification service.

## TypeScript Types

Database types in `frontend/src/lib/database.types.ts` are maintained manually to match the MySQL schema.

## Styling

Uses **Tailwind CSS** with PostCSS. Configuration in `frontend/tailwind.config.js` and `frontend/postcss.config.js`. Global styles in `frontend/src/index.css`.

The design uses a gradient background (`from-slate-50 via-blue-50 to-cyan-50`) and modern UI patterns with Lucide React icons.

## Deployment (O2Switch)

The application is deployed on O2Switch using **Phusion Passenger**. The entry point is `passenger_app.cjs` at the root.

**Deployment steps:**
1. Build backend: `pnpm build:backend`
2. Build frontend: `pnpm build:frontend`
3. Configure MySQL database with credentials in `backend/.env`
4. Run `backend/src/db/schema.sql` to initialize database
5. Passenger will use `passenger_app.cjs` to start the Express server
6. Frontend static files are served from `frontend/dist/`

**Environment variables for production:**
- Backend: Set DB_* variables for MySQL connection
- Frontend build: Set `VITE_API_URL` to production API URL before building

## Development Notes

- Backend runs on port 3001 by default
- Frontend runs on port 5173 by default (Vite)
- CORS is configured to allow frontend URL
- All routes use MySQL transactions where appropriate
- Registration codes and QR codes are generated using nanoid
- The frontend makes direct HTTP calls to the backend API
- No authentication system (internal/demo app)

## Common Tasks

### Add a new API endpoint
1. Create route handler in `backend/src/routes/`
2. Add route to `backend/src/index.ts`
3. Add method to `frontend/src/lib/api.ts`
4. Use in components via the API client

### Add a new database table
1. Add CREATE TABLE to `backend/src/db/schema.sql`
2. Create route handler in `backend/src/routes/`
3. Update `frontend/src/lib/database.types.ts` with types
4. Add API methods in `frontend/src/lib/api.ts`

### Modify gamification logic
1. Update `backend/src/services/gamification.service.ts`
2. Update constants in `frontend/src/lib/gamification.ts` if needed
3. Test registration and attendance flows
