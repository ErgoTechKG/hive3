import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import upload from '../middleware/upload';

const router = Router();

// Get all users (secretary/leader only)
router.get(
  '/',
  authenticate,
  authorize('secretary', 'leader'),
  [
    query('role').optional().isIn(['leader', 'secretary', 'professor', 'student']),
    query('department').optional().isString(),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  userController.getUsers
);

// Get user by ID
router.get(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  userController.getUserById
);

// Update user profile
router.put(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('nameCn').optional().trim().notEmpty(),
    body('nameEn').optional().trim().notEmpty(),
    body('phone').optional().trim().isMobilePhone('zh-CN'),
    body('department').optional().trim().notEmpty(),
  ],
  validate,
  userController.updateUser
);

// Upload avatar
router.post(
  '/:id/avatar',
  authenticate,
  upload.single('avatar'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  userController.uploadAvatar
);

// Activate/Deactivate user (secretary/leader only)
router.patch(
  '/:id/status',
  authenticate,
  authorize('secretary', 'leader'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('Active status is required'),
  ],
  validate,
  userController.updateUserStatus
);

// Get user statistics (for dashboard)
router.get(
  '/:id/statistics',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  userController.getUserStatistics
);

// Batch import users (secretary/leader only)
router.post(
  '/batch/import',
  authenticate,
  authorize('secretary', 'leader'),
  upload.single('file'),
  userController.batchImportUsers
);

// Export users (secretary/leader only)
router.get(
  '/export/csv',
  authenticate,
  authorize('secretary', 'leader'),
  userController.exportUsers
);

export default router;