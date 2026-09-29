// ============================================================================
// Member 4 - Express App & API Router
// ============================================================================

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import providerRoutes from './routes/providerRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'ReViveX Member 4 Backend API' });
});

// Phase 1 Routes
app.use('/api/providers', providerRoutes);

// Fallback 404 Handler
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
