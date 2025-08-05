import { Response, NextFunction } from 'express';
import Task from '../models/Task';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { getIO as getSocketIO } from '../socket';

// Get tasks with filters
export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const {
      type,
      status,
      priority,
      role = 'receiver',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query: any = {};
    
    // Filter by sender or receiver
    if (role === 'sender') {
      query.sender = req.user._id;
    } else {
      query.receivers = req.user._id;
    }
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('sender', 'nameCn nameEn role department')
      .populate('receivers', 'nameCn nameEn role department')
      .populate('relatedCourse', 'nameCn courseId')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get task by ID
export const getTaskById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('sender', 'nameCn nameEn role department avatar')
      .populate('receivers', 'nameCn nameEn role department avatar')
      .populate('relatedCourse', 'nameCn courseId')
      .populate('responses.userId', 'nameCn nameEn');

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    // Check access permissions
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }
    
    const userId = (req.user?._id as any).toString();
    const hasAccess = 
      task.sender._id.toString() === userId ||
      task.receivers.some((r: any) => r._id.toString() === userId) ||
      req.user.role === 'secretary' ||
      req.user.role === 'leader';

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// Create new task
export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const {
      title,
      description,
      type,
      receivers,
      deadline,
      priority = 'medium',
      relatedCourse,
      metadata
    } = req.body;

    // Process file attachments if any
    const attachments = req.files ? (req.files as Express.Multer.File[]).map(file => ({
      filename: file.originalname,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date()
    })) : [];

    const task = new Task({
      taskId: `T-${new Date().getFullYear()}-${uuidv4().substr(0, 8).toUpperCase()}`,
      title,
      description,
      type,
      sender: req.user._id,
      receivers,
      deadline,
      priority,
      relatedCourse,
      attachments,
      metadata
    });

    await task.save();
    
    // Populate for response
    await task.populate('sender', 'nameCn nameEn');
    await task.populate('receivers', 'nameCn nameEn');

    // Send real-time notifications
    const io = getSocketIO();
    if (io) {
      receivers.forEach((receiverId: string) => {
        (io as any).to(`user:${receiverId}`).emit('task:new', {
          task: {
            _id: task._id,
            title: task.title,
            type: task.type,
            priority: task.priority,
            sender: task.sender,
            deadline: task.deadline
          }
        });
      });
    }

    logger.info(`Task created: ${task.taskId} by ${req.user?.username}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// Update task response
export const updateTaskResponse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    // Check if user is a receiver
    if (!task.receivers.includes(req.user?._id as any)) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Process file attachments if any
    const attachments = req.files ? (req.files as Express.Multer.File[]).map(file => ({
      filename: file.originalname,
      url: `/uploads/${file.filename}`
    })) : [];

    // Update or add response
    const existingResponseIndex = task.responses.findIndex(
      r => r.userId.toString() === (req.user?._id as any).toString()
    );

    const response = {
      userId: req.user?._id as any,
      status,
      message,
      attachments,
      respondedAt: new Date()
    };

    if (existingResponseIndex >= 0) {
      task.responses[existingResponseIndex] = response;
    } else {
      task.responses.push(response);
    }

    // Update task status based on responses
    if (task.type === 'read' && status === 'read') {
      task.status = 'read';
    } else if (task.type === 'action' && status === 'completed') {
      // Check if all receivers have completed
      const allCompleted = task.receivers.every(receiverId =>
        task.responses.some(r => 
          r.userId.toString() === receiverId.toString() && 
          r.status === 'completed'
        )
      );
      if (allCompleted) {
        task.status = 'completed';
      } else {
        task.status = 'in_progress';
      }
    } else if (status === 'rejected') {
      task.status = 'rejected';
    }

    await task.save();

    // Send real-time notification to sender
    const io = getSocketIO();
    if (io) {
      (io as any).to(`user:${task.sender}`).emit('task:statusUpdate', {
        taskId: task._id,
        status: task.status,
        userId: req.user?._id as any,
        userResponse: status
      });
    }

    logger.info(`Task response updated: ${task.taskId} by ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Response updated successfully',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// Mark task as read
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    // Check if user is a receiver
    if (!task.receivers.includes(req.user?._id as any)) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Add read response
    const existingResponse = task.responses.find(
      r => r.userId.toString() === (req.user?._id as any).toString()
    );

    if (!existingResponse) {
      task.responses.push({
        userId: req.user?._id as any,
        status: 'read',
        respondedAt: new Date()
      });

      if (task.type === 'read') {
        task.status = 'read';
      }

      await task.save();
    }

    res.json({
      success: true,
      message: 'Task marked as read',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// Send reminder
export const sendReminder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { level = 'normal' } = req.body;

    const task = await Task.findById(id)
      .populate('receivers', 'nameCn email');

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    // Check if user is the sender
    if (task.sender.toString() !== (req.user?._id as any).toString() &&
        req.user?.role !== 'secretary' &&
        req.user?.role !== 'leader') {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Find receivers who haven't responded
    const pendingReceivers = task.receivers.filter((receiver: any) =>
      !task.responses.some(r => r.userId.toString() === receiver._id.toString())
    );

    // Add reminder record
    task.reminders.push({
      sentAt: new Date(),
      level
    });
    await task.save();

    // Send real-time reminders
    const io = getSocketIO();
    if (io) {
      pendingReceivers.forEach((receiver: any) => {
        (io as any).to(`user:${receiver._id}`).emit('task:reminder', {
          taskId: task._id,
          title: task.title,
          level,
          deadline: task.deadline
        });
      });
    }

    logger.info(`Reminder sent for task ${task.taskId} by ${req.user?.username}`);

    res.json({
      success: true,
      message: `Reminder sent to ${pendingReceivers.length} users`,
      data: { 
        remindedUsers: pendingReceivers.length,
        reminderLevel: level
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get task statistics
export const getTaskStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;

    // Sent tasks statistics
    const sentStats = await Task.aggregate([
      { $match: { sender: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Received tasks statistics
    const receivedStats = await Task.aggregate([
      { $match: { receivers: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Task completion rate
    const totalReceived = await Task.countDocuments({ receivers: userId });
    const completedByUser = await Task.countDocuments({
      receivers: userId,
      'responses.userId': userId,
      'responses.status': { $in: ['completed', 'read'] }
    });

    const completionRate = totalReceived > 0 ? 
      Math.round((completedByUser / totalReceived) * 100) : 0;

    res.json({
      success: true,
      data: {
        sent: {
          total: sentStats.reduce((sum, s) => sum + s.count, 0),
          byStatus: sentStats
        },
        received: {
          total: receivedStats.reduce((sum, s) => sum + s.count, 0),
          byStatus: receivedStats
        },
        completionRate,
        pendingTasks: await Task.countDocuments({
          receivers: userId,
          status: { $in: ['pending', 'in_progress'] }
        })
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get overdue tasks
export const getOverdueTasks = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const overdueTasks = await Task.find({
      deadline: { $lt: new Date() },
      status: { $nin: ['completed', 'rejected'] }
    })
    .populate('sender', 'nameCn department')
    .populate('receivers', 'nameCn department')
    .sort({ deadline: 1 });

    res.json({
      success: true,
      data: { 
        tasks: overdueTasks,
        total: overdueTasks.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Batch create tasks
export const batchCreateTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tasks } = req.body;

    const createdTasks = await Promise.all(
      tasks.map(async (taskData: any) => {
        const task = new Task({
          ...taskData,
          taskId: `T-${new Date().getFullYear()}-${uuidv4().substr(0, 8).toUpperCase()}`,
          sender: req.user?._id
        });
        
        return task.save();
      })
    );

    logger.info(`Batch created ${createdTasks.length} tasks by ${req.user?.username}`);

    res.status(201).json({
      success: true,
      message: `${createdTasks.length} tasks created successfully`,
      data: { tasks: createdTasks }
    });
  } catch (error) {
    next(error);
  }
};

// Get task templates
export const getTaskTemplates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Predefined templates based on role
    const templates = {
      secretary: [
        {
          title: '课程部署提醒',
          description: '请在规定时间内完成课程部署，包括上传课程大纲、设置考核方式等。',
          type: 'action',
          priority: 'high'
        },
        {
          title: '选课结果确认',
          description: '选课结果已公布，请及时确认您的选课结果。',
          type: 'action',
          priority: 'medium'
        }
      ],
      leader: [
        {
          title: '年度报告审阅',
          description: '请审阅本年度教学质量报告，并提供反馈意见。',
          type: 'approval',
          priority: 'high'
        },
        {
          title: '政策更新通知',
          description: '新的教学政策已发布，请查阅并确认。',
          type: 'read',
          priority: 'medium'
        }
      ]
    };

    const userTemplates = templates[req.user?.role as keyof typeof templates] || [];

    res.json({
      success: true,
      data: { templates: userTemplates }
    });
  } catch (error) {
    next(error);
  }
};

// Archive completed tasks
export const archiveCompletedTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { beforeDate } = req.body;

    const result = await Task.updateMany(
      {
        status: 'completed',
        updatedAt: { $lt: new Date(beforeDate) }
      },
      {
        $set: { 
          status: 'archived',
          archivedAt: new Date(),
          archivedBy: req.user?._id
        }
      }
    );

    logger.info(`Archived ${result.modifiedCount} tasks by ${req.user?.username}`);

    res.json({
      success: true,
      message: `Archived ${result.modifiedCount} tasks`,
      data: { archivedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

// Get my tasks (for convenience)
export const getMyTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;

    const query: any = {
      receivers: req.user?._id
    };

    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('sender', 'nameCn nameEn avatar')
      .populate('relatedCourse', 'nameCn')
      .sort({ priority: -1, deadline: 1, createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

