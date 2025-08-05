import dotenv from 'dotenv';

dotenv.config();

export default {
  env: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '5000', 10),
  
  mongodb: {
    uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/course-selection',
  },
  
  redis: {
    url: process.env['REDIS_URL'] || 'redis://localhost:6379',
  },
  
  jwt: {
    secret: process.env['JWT_SECRET'] || 'your-secret-key-change-in-production',
    accessExpirationMinutes: parseInt(process.env['JWT_ACCESS_EXPIRATION_MINUTES'] || '30', 10),
    refreshExpirationDays: parseInt(process.env['JWT_REFRESH_EXPIRATION_DAYS'] || '30', 10),
    resetPasswordExpirationMinutes: 10,
    verifyEmailExpirationMinutes: 10,
  },
  
  email: {
    smtp: {
      host: process.env['EMAIL_HOST'],
      port: parseInt(process.env['EMAIL_PORT'] || '587', 10),
      secure: process.env['EMAIL_SECURE'] === 'true',
      auth: {
        user: process.env['EMAIL_USERNAME'],
        pass: process.env['EMAIL_PASSWORD'],
      },
    },
    from: process.env['EMAIL_FROM'] || 'noreply@course-selection.edu.cn',
  },
  
  cors: {
    origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  
  upload: {
    maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10), // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  bcrypt: {
    saltRounds: 10,
  },
};