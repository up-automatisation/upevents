import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

// Import routes
import eventsRouter from './routes/events.js';
import categoriesRouter from './routes/categories.js';
import registrationsRouter from './routes/registrations.js';
import attendanceRouter from './routes/attendance.js';
import programSlotsRouter from './routes/program-slots.js';
import customFieldsRouter from './routes/custom-fields.js';
import registrationDataRouter from './routes/registration-data.js';
import statisticsRouter from './routes/statistics.js';
import gamificationRouter from './routes/gamification.js';
import authRouter from './routes/auth.js';

// Import middleware
import { requireAuth } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'o9&S#ShF7hsHAFq$-upevents-secret-2026',
  resave: false,
  saveUninitialized: false,
  name: 'upevents.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  }
}));

// Request logging middleware
app.use((req: any, res: any, next: any) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public, no protection)
app.use('/api/auth', authRouter);

// Public routes that don't require authentication
const publicRoutes = [
  { method: 'GET', path: /^\/api\/events\/by-registration-code\/.+$/ },
  { method: 'GET', path: /^\/api\/events\/by-attendance-code\/.+$/ },
  { method: 'POST', path: /^\/api\/registrations$/ },
  { method: 'GET', path: /^\/api\/registrations\/by-qr\/.+$/ },
  { method: 'POST', path: /^\/api\/attendance$/ },
  { method: 'GET', path: /^\/api\/attendance\/by-registration\/.+$/ },
  { method: 'GET', path: /^\/api\/custom-fields\/by-event\/.+$/ },
  { method: 'GET', path: /^\/api\/program-slots\/by-event\/.+$/ },
  { method: 'POST', path: /^\/api\/registration-data\/batch$/ },
  { method: 'POST', path: /^\/api\/gamification\/award-attendance$/ },
  { method: 'GET', path: /^\/api\/gamification\/config$/ },
  { method: 'GET', path: /^\/health$/ }
];

// Conditional auth middleware - protect all API routes except public ones
app.use('/api', (req: any, res: any, next: any) => {
  // Check if this route is in the public routes list
  const isPublicRoute = publicRoutes.some(route => {
    return route.method === req.method && route.path.test(req.path);
  });

  if (isPublicRoute) {
    next();
  } else {
    requireAuth(req, res, next);
  }
});

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/program-slots', programSlotsRouter);
app.use('/api/custom-fields', customFieldsRouter);
app.use('/api/registration-data', registrationDataRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/gamification', gamificationRouter);

// In production, serve the frontend static files
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));

  // All non-API routes serve the frontend (SPA fallback)
  app.get('*', (req: any, res: any) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use((req: any, res: any) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`UpEvents API server running on http://localhost:${PORT}`);
  });
}

export default app;
