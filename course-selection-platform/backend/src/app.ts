import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import config from './config';
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import taskRoutes from './routes/task.routes';
import analyticsRoutes from './routes/analytics.routes';
import socketHandler from './socket';

class App {
  public app: Application;
  public server: any;
  public io: SocketServer;
  public redisClient: any;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: {
        origin: config.cors.origin,
        credentials: true
      }
    });
    
    this.connectDatabase();
    this.connectRedis();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketIO();
    this.initializeErrorHandling();
  }

  private async connectDatabase(): Promise<void> {
    try {
      await mongoose.connect(config.mongodb.uri);
      logger.info('MongoDB connected successfully');
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }

  private connectRedis(): void {
    this.redisClient = createClient({
      url: config.redis.url
    });

    this.redisClient.on('error', (err: Error) => {
      logger.error('Redis Client Error', err);
    });

    this.redisClient.connect().then(() => {
      logger.info('Redis connected successfully');
    });
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(mongoSanitize());
    
    // CORS
    this.app.use(cors(config.cors));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Compression
    this.app.use(compression());
    
    // Logging
    if (config.env !== 'test') {
      this.app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
    }
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    
    this.app.use('/api/', limiter);
    
    // Stricter rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skipSuccessfulRequests: true,
    });
    
    this.app.use('/api/auth/login', authLimiter);
    this.app.use('/api/auth/register', authLimiter);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env
      });
    });

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.status(200).json({
        message: 'Course Selection Platform API',
        version: '1.0.0',
        status: 'Running',
        endpoints: {
          health: '/health',
          auth: '/api/auth',
          users: '/api/users',
          courses: '/api/courses',
          enrollments: '/api/enrollments',
          tasks: '/api/tasks',
          analytics: '/api/analytics'
        }
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/courses', courseRoutes);
    this.app.use('/api/enrollments', enrollmentRoutes);
    this.app.use('/api/tasks', taskRoutes);
    this.app.use('/api/analytics', analyticsRoutes);

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    });
  }

  private initializeSocketIO(): void {
    socketHandler(this.io, this.redisClient);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection:', reason);
      // Close server & exit process
      this.server.close(() => process.exit(1));
    });
  }

  public listen(): void {
    this.server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port} in ${config.env} mode`);
    });
  }
}

export default App;