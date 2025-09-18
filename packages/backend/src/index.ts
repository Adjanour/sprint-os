import { Hono } from 'hono';
import { cors } from '@hono/cors';
import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import sprintRoutes from './routes/sprints';
import projectItemRoutes from './routes/project-items';
import docRoutes from './routes/docs';
import threadRoutes from './routes/threads';
import analyticsRoutes from './routes/analytics';
import githubRoutes from './routes/github';

// Load environment variables
dotenv.config();

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation
app.get('/docs', swaggerUI({ url: '/api-docs' }));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/sprints', sprintRoutes);
app.route('/api/project-items', projectItemRoutes);
app.route('/api/docs', docRoutes);
app.route('/api/threads', threadRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/github', githubRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

const port = parseInt(process.env.PORT || '3001');

console.log(`Starting SprintOS backend on port ${port}`);

serve({
  fetch: app.fetch,
  port
});