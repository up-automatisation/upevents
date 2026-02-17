import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Request logging middleware
app.use((req: any, res: any, next: any) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
