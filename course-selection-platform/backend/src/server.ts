import App from './app';
import logger from './utils/logger';

const app = new App();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  app.server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  app.server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start server
app.listen();