import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { getEnv } from './config/env.js';
import { logger } from './logger.js';
import authRouter from './auth/credentials.js';
import bcRouter from './routes/blockchain.js';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi.js';

const app = express();

// Test route at the very beginning
app.get('/test', (_req: Request, res: Response) => {
  res.json({ message: 'Test route working' });
});

app.set('trust proxy', 1);
// Updated CORS configuration to allow both localhost and Render.com origins
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:4000',
      'http://localhost:3000',
      'https://ds-smartcontract1.onrender.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use('/auth', authRouter);
app.use('/blockchain', bcRouter);

// Debug route to check what's in openapiSpec before serving
app.get('/debug-spec', (_req, res) => {
  res.json({
    servers: openapiSpec.servers,
    serverCount: openapiSpec.servers.length
  });
});

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));
app.get('/docs.json', (_req, res) => {
  // Log what we're about to send
  console.log('Serving OpenAPI spec with servers:', openapiSpec.servers);
  res.json(openapiSpec);
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  
  logger.error({ err }, 'Unhandled error');
  const isProd = getEnv().NODE_ENV === 'production';
  if (isProd) return res.status(500).json({ error: 'Internal Server Error' });
  return res.status(500).json({ error: 'internal_error', message: err.message });
});

const { PORT } = getEnv();
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server listening');
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));