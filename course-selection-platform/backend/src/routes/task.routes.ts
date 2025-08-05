import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as taskController from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import upload from '../middleware/upload';

const router = Router();

// Get tasks (with filters)
router.get(
  '/',
  authenticate,
  [
    query('type').optional().isIn(['read', 'action', 'approval']),
    query('status').optional().isIn(['pending', 'read', 'in_progress', 'completed', 'overdue', 'rejected']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('role').optional().isIn(['sender', 'receiver']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  taskController.getTasks
);

// Get task by ID
router.get(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
  ],
  validate,
  taskController.getTaskById
);

// Create new task
router.post(
  '/',
  authenticate,
  upload.array('attachments', 5),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('type').isIn(['read', 'action', 'approval']).withMessage('Invalid task type'),
    body('receivers').isArray({ min: 1 }).withMessage('At least one receiver is required'),
    body('receivers.*').isMongoId().withMessage('Invalid receiver ID'),
    body('deadline').optional().isISO8601().withMessage('Invalid deadline'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('relatedCourse').optional().isMongoId(),
  ],
  validate,
  taskController.createTask
);

// Update task response
router.put(
  '/:id/response',
  authenticate,
  upload.array('attachments', 3),
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('status').isIn(['read', 'completed', 'rejected']).withMessage('Invalid status'),
    body('message').optional().isString(),
  ],
  validate,
  taskController.updateTaskResponse
);

// Mark task as read
router.post(
  '/:id/read',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
  ],
  validate,
  taskController.markAsRead
);

// Send reminder
router.post(
  '/:id/remind',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('level').optional().isIn(['gentle', 'normal', 'urgent']),
  ],
  validate,
  taskController.sendReminder
);

// Get task statistics (for dashboard)
router.get(
  '/statistics/overview',
  authenticate,
  taskController.getTaskStatistics
);

// Get overdue tasks
router.get(
  '/overdue/list',
  authenticate,
  authorize('secretary', 'leader'),
  taskController.getOverdueTasks
);

// Batch create tasks (secretary/leader only)
router.post(
  '/batch/create',
  authenticate,
  authorize('secretary', 'leader'),
  [
    body('tasks').isArray({ min: 1 }).withMessage('Tasks array is required'),
    body('tasks.*.title').trim().notEmpty(),
    body('tasks.*.description').trim().notEmpty(),
    body('tasks.*.type').isIn(['read', 'action', 'approval']),
    body('tasks.*.receivers').isArray({ min: 1 }),
  ],
  validate,
  taskController.batchCreateTasks
);

// Get task templates
router.get(
  '/templates/list',
  authenticate,
  authorize('secretary', 'leader'),
  taskController.getTaskTemplates
);

// Archive completed tasks
router.post(
  '/archive/completed',
  authenticate,
  authorize('secretary', 'leader'),
  [
    body('beforeDate').isISO8601().withMessage('Valid date is required'),
  ],
  validate,
  taskController.archiveCompletedTasks
);

export default router;