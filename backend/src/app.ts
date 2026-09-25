import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import reviewRoutes from './routes/review.routes';
import { sendError } from './utils/apiResponse';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', message: 'ReViveX API is active' });
});

// Member 6 Review Module Routes
app.use('/api', reviewRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  sendError(res, `Route ${req.originalUrl} not found`, 'NOT_FOUND', [], 404);
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  sendError(
    res,
    'An unexpected error occurred on the server',
    'INTERNAL_SERVER_ERROR',
    [err?.message || 'Server error'],
    500
  );
});

export default app;
