import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as courseController from '../controllers/course.controller';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';

const router = Router();

// Get all courses (with filters)
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['draft', 'pending_approval', 'approved', 'published', 'archived']),
    query('semester').optional().isString(),
    query('professor').optional().isMongoId(),
    query('tags').optional().isString(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  courseController.getCourses
);

// Get course by ID
router.get(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  courseController.getCourseById
);

// Create new course (professors only)
router.post(
  '/',
  authenticate,
  authorize('professor'),
  [
    body('courseId').trim().notEmpty().withMessage('Course ID is required'),
    body('nameCn').trim().notEmpty().withMessage('Chinese name is required'),
    body('nameEn').trim().notEmpty().withMessage('English name is required'),
    body('descriptionCn').trim().notEmpty().withMessage('Chinese description is required'),
    body('descriptionEn').trim().notEmpty().withMessage('English description is required'),
    body('credits').isFloat({ min: 0.5, max: 6 }).withMessage('Credits must be between 0.5 and 6'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('semester').trim().notEmpty().withMessage('Semester is required'),
    body('schedule').isArray({ min: 1 }).withMessage('Schedule is required'),
    body('schedule.*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Invalid day of week'),
    body('schedule.*.startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time'),
    body('schedule.*.endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time'),
    body('schedule.*.location').trim().notEmpty().withMessage('Location is required'),
  ],
  validate,
  courseController.createCourse
);

// Update course (professor who owns it or secretary/leader)
router.put(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
    body('nameCn').optional().trim().notEmpty(),
    body('nameEn').optional().trim().notEmpty(),
    body('descriptionCn').optional().trim().notEmpty(),
    body('descriptionEn').optional().trim().notEmpty(),
    body('credits').optional().isFloat({ min: 0.5, max: 6 }),
    body('capacity').optional().isInt({ min: 1 }),
    body('schedule').optional().isArray({ min: 1 }),
  ],
  validate,
  courseController.updateCourse
);

// Delete course (professor who owns it or secretary/leader)
router.delete(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  courseController.deleteCourse
);

// Submit course for approval (professors only)
router.post(
  '/:id/submit',
  authenticate,
  authorize('professor'),
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  courseController.submitForApproval
);

// Approve/reject course (secretary/leader only)
router.post(
  '/:id/approve',
  authenticate,
  authorize('secretary', 'leader'),
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
    body('approved').isBoolean().withMessage('Approval status is required'),
    body('comment').optional().isString(),
  ],
  validate,
  courseController.approveCourse
);

// Publish course (secretary only)
router.post(
  '/:id/publish',
  authenticate,
  authorize('secretary'),
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  courseController.publishCourse
);

// Archive course (secretary/leader only)
router.post(
  '/:id/archive',
  authenticate,
  authorize('secretary', 'leader'),
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  courseController.archiveCourse
);

// Get course statistics (for analytics)
router.get(
  '/:id/statistics',
  authenticate,
  authorize('professor', 'secretary', 'leader'),
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  courseController.getCourseStatistics
);

// Get courses by professor
router.get(
  '/professor/:professorId',
  authenticate,
  [
    param('professorId').isMongoId().withMessage('Invalid professor ID'),
    query('semester').optional().isString(),
  ],
  validate,
  courseController.getCoursesByProfessor
);

// Batch operations (secretary/leader only)
router.post(
  '/batch/publish',
  authenticate,
  authorize('secretary', 'leader'),
  [
    body('courseIds').isArray({ min: 1 }).withMessage('Course IDs are required'),
    body('courseIds.*').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  courseController.batchPublishCourses
);

export default router;