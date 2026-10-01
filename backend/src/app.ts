// ============================================================================
// Member 3 - Express App & API Router
// ============================================================================

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import recommendationRoutes from './routes/recommendationRoutes';
import searchRoutes from './routes/searchRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'ReViveX Backend API' });
});

// Member 3 - Recommendation Routes
app.use('/api/recommendations', recommendationRoutes);

// Member 3 - Search & Filtering Routes
app.use('/api/search', searchRoutes);

// 404 Fallback Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    statusCode: 500,
    error: err.message || 'Internal server error',
  });
});

export default app;
