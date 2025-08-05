import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';
import User from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

const socketHandler = (io: SocketServer, redisClient: any) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
      const user = await User.findById(decoded.id).select('role');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);
    
    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    // Handle joining course rooms
    socket.on('join:course', (courseId: string) => {
      socket.join(`course:${courseId}`);
      logger.info(`User ${socket.userId} joined course room: ${courseId}`);
    });

    // Handle task notifications
    socket.on('task:created', async (data: any) => {
      const { receivers, task } = data;
      
      // Notify all receivers
      receivers.forEach((receiverId: string) => {
        io.to(`user:${receiverId}`).emit('task:new', task);
      });
      
      logger.info(`Task created and notified to ${receivers.length} users`);
    });

    // Handle task updates
    socket.on('task:updated', (data: any) => {
      const { taskId, status, userId } = data;
      
      // Broadcast to relevant users
      io.to(`task:${taskId}`).emit('task:statusUpdate', { taskId, status, userId });
    });

    // Handle enrollment notifications
    socket.on('enrollment:update', (data: any) => {
      const { studentId, courseId, status } = data;
      
      // Notify student
      io.to(`user:${studentId}`).emit('enrollment:statusChanged', { courseId, status });
      
      // Notify course room
      io.to(`course:${courseId}`).emit('enrollment:update', { studentId, status });
    });

    // Handle real-time course updates
    socket.on('course:update', (data: any) => {
      const { courseId, update } = data;
      
      // Broadcast to all users in the course room
      io.to(`course:${courseId}`).emit('course:updated', update);
    });

    // Handle typing indicators for messages
    socket.on('typing:start', (data: any) => {
      const { room, userName } = data;
      socket.to(room).emit('typing:user', { userId: socket.userId, userName });
    });

    socket.on('typing:stop', (data: any) => {
      const { room } = data;
      socket.to(room).emit('typing:userStopped', { userId: socket.userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });

  // Emit system-wide notifications
  const emitSystemNotification = (notification: any) => {
    io.emit('system:notification', notification);
  };

  // Emit role-specific notifications
  const emitRoleNotification = (role: string, notification: any) => {
    io.to(`role:${role}`).emit('role:notification', notification);
  };

  return {
    emitSystemNotification,
    emitRoleNotification,
  };
};

export default socketHandler;