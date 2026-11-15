import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { resolve } from 'node:path';

// Member 1 - Auth & User Routes
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware';

// Member 3 - Smart Recommendation, Search & Discovery Routes
import recommendationRoutes from './routes/recommendationRoutes';
import searchRoutes from './routes/searchRoutes';
import discoveryRoutes from './routes/discoveryRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(resolve(process.cwd(), 'uploads')));

// Health Check Endpoints (Supports both Member 1 & Member 3 contracts)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'ReViveX Backend API' });
});

// Root fallback route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'ReViveX API',
    status: 'running',
    healthCheck: '/api/health',
  });
});

// Member 1 - Core API Routes (/api/auth, /api/users, /api/admin, /api/health)
app.use('/api', apiRoutes);

// Member 3 - Recommendation, Search & Discovery Routes
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/discovery', discoveryRoutes);

// Unknown routes + global error handler (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[ReViveX Backend] Server is running on port ${PORT}`);
    console.log(`[ReViveX Backend] Health endpoint: http://localhost:${PORT}/api/health`);
  });
}

export default app;
