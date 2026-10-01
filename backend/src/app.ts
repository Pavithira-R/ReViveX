import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Root fallback route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'ReViveX API',
    status: 'running',
    healthCheck: '/api/health',
  });
});

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
