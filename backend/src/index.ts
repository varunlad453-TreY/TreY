// ============================================
// COMPLIANCE EXECUTION SYSTEM - MAIN SERVER
// ============================================
// System of Record for Compliance Execution
// 
// CORE PRINCIPLE ENFORCEMENT:
// 1. Every obligation has exactly ONE owner
// 2. Every obligation has a fixed SLA date
// 3. All timestamps are immutable
// 4. Evidence must be attached BEFORE deadline
// 5. ALL actions generate audit logs - NO EXCEPTIONS

import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import { captureException, initMonitoring } from './config/monitoring';

initMonitoring();

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  logger.error('[FATAL] Uncaught Exception', { error: err instanceof Error ? err.message : String(err) });
  captureException(err);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[FATAL] Unhandled Rejection', { promise: String(promise), reason: String(reason) });
  captureException(reason);
  // Don't exit - keep server running
});

// Import routes (will be converted to TypeScript)
import authRoutes from './routes/auth';
import obligationsRoutes from './routes/obligations';
import slaRoutes from './routes/sla';
import evidenceRoutes from './routes/evidence';
import exportRoutes from './routes/export';
import usersRoutes from './routes/users';
import alertsRoutes from './routes/alerts';
import organizationsRoutes from './routes/organizations';
import auditRoutes from './routes/audit';
import ingestionRoutes from './routes/ingestion';
import webhooksRoutes from './routes/webhooks';

// Import cron jobs
import { startSLAAlertJob } from './jobs/slaAlertJob';

const app: Express = express();
app.set('trust proxy', 1);
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - Per rulebook: 100 req / 15 min general, 5 req / 15 min auth
// Use safe production defaults while allowing dev/test override via environment.
const apiRateLimitMax = parseInt(
  process.env.RATE_LIMIT_API_MAX || (process.env.NODE_ENV === 'production' ? '100' : '1000'),
  10
);
const authRateLimitMax = parseInt(
  process.env.RATE_LIMIT_AUTH_MAX || (process.env.NODE_ENV === 'production' ? '5' : '100'),
  10
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: apiRateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: authRateLimitMax,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Parse JSON bodies
app.use(express.json());
import passport from './config/passport';
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));

// Request logging (for debugging)
app.use((req: Request, _res: Response, next: NextFunction): void => {
  logger.info('Incoming request', { method: req.method, path: req.path });
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ 
    status: 'healthy',
    service: 'Compliance Execution System',
    timestamp: new Date().toISOString()
  });
});

// Sentry verification endpoints - register only for non-production or when explicitly allowed
if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEBUG_ROUTES === 'true') {
  // Sentry verification endpoint - remove after confirming events are flowing
  app.get('/debug-sentry', (_req: Request, _res: Response): void => {
    throw new Error('My first Sentry error!');
  });

  // Temporary second Sentry verification endpoint - remove after confirming alert firing
  app.get('/debug-sentry-2', (_req: Request, _res: Response): void => {
    throw new Error('My second Sentry error!');
  });
} else {
  // In production, respond 404 to these paths (keeps behavior predictable)
  app.get('/debug-sentry', (_req: Request, res: Response): void => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found' });
  });

  app.get('/debug-sentry-2', (_req: Request, res: Response): void => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found' });
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/obligations', obligationsRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Error handling middleware
interface ErrorWithMessage extends Error {
  message: string;
}

app.use((err: ErrorWithMessage, _req: Request, res: Response, _next: NextFunction): void => {
  logger.error('[ERROR] Request failed', { error: err.message, stack: err.stack });
  captureException(err);
  
  // Check for enforcement violations
  if (err.message && err.message.includes('ENFORCEMENT VIOLATION')) {
    res.status(400).json({
      error: 'ENFORCEMENT_VIOLATION',
      message: err.message
    });
    return;
  }
  
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// 404 handler
app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, (): void => {
  logger.info('============================================');
  logger.info('COMPLIANCE EXECUTION SYSTEM - BACKEND');
  logger.info('============================================');
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('');
  logger.info('ENFORCEMENT RULES ACTIVE:');
  logger.info('- Obligations cannot be deleted');
  logger.info('- Owners are append-only (reassignment creates new record)');
  logger.info('- SLAs are append-only (extensions create new record)');
  logger.info('- Evidence is immutable after upload');
  logger.info('- Late evidence is automatically flagged');
  logger.info('- ALL actions generate audit logs');
  logger.info('============================================');
  
  // Start SLA alert cron job
  logger.info('');
  logger.info('STARTING BACKGROUND JOBS...');
  startSLAAlertJob();
  logger.info('============================================');
});

export default app;
