import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as enrollmentController from '../controllers/enrollment.controller';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';

const router = Router();

// Get enrollments (with filters)
router.get(
  '/',
  authenticate,
  [
    query('student').optional().isMongoId(),
    query('course').optional().isMongoId(),
    query('semester').optional().isString(),
    query('status').optional().isIn(['pending', 'selected', 'confirmed', 'rejected', 'waitlisted', 'dropped']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  enrollmentController.getEnrollments
);

// Get enrollment by ID
router.get(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid enrollment ID'),
  ],
  validate,
  enrollmentController.getEnrollmentById
);

// Submit course preferences (students only)
router.post(
  '/preferences',
  authenticate,
  authorize('student'),
  [
    body('semester').trim().notEmpty().withMessage('Semester is required'),
    body('preferences').isArray({ min: 1, max: 5 }).withMessage('Preferences must be 1-5 courses'),
    body('preferences.*.courseId').isMongoId().withMessage('Invalid course ID'),
    body('preferences.*.rank').isInt({ min: 1, max: 5 }).withMessage('Rank must be 1-5'),
    body('preferences.*.reason').optional().isString(),
  ],
  validate,
  enrollmentController.submitPreferences
);

// Update preferences (students only, before deadline)
router.put(
  '/preferences',
  authenticate,
  authorize('student'),
  [
    body('semester').trim().notEmpty().withMessage('Semester is required'),
    body('preferences').isArray({ min: 1, max: 5 }).withMessage('Preferences must be 1-5 courses'),
  ],
  validate,
  enrollmentController.updatePreferences
);

// Run course matching algorithm (secretary only)
router.post(
  '/match',
  authenticate,
  authorize('secretary'),
  [
    body('semester').trim().notEmpty().withMessage('Semester is required'),
    body('algorithm').optional().isIn(['priority', 'lottery', 'hybrid']).withMessage('Invalid algorithm'),
  ],
  validate,
  enrollmentController.runMatchingAlgorithm
);

// Confirm enrollment (students only)
router.post(
  '/:id/confirm',
  authenticate,
  authorize('student'),
  [
    param('id').isMongoId().withMessage('Invalid enrollment ID'),
  ],
  validate,
  enrollmentController.confirmEnrollment
);

// Drop course (students only)
router.post(
  '/:id/drop',
  authenticate,
  authorize('student'),
  [
    param('id').isMongoId().withMessage('Invalid enrollment ID'),
    body('reason').optional().isString(),
  ],
  validate,
  enrollmentController.dropCourse
);

// Professor approval/rejection
router.post(
  '/:id/professor-review',
  authenticate,
  authorize('professor'),
  [
    param('id').isMongoId().withMessage('Invalid enrollment ID'),
    body('approved').isBoolean().withMessage('Approval status is required'),
    body('comment').optional().isString(),
  ],
  validate,
  enrollmentController.professorReview
);

// Get enrollment statistics (secretary/leader only)
router.get(
  '/statistics/:semester',
  authenticate,
  authorize('secretary', 'leader'),
  [
    param('semester').notEmpty().withMessage('Semester is required'),
  ],
  validate,
  enrollmentController.getEnrollmentStatistics
);

// Export enrollment data (secretary/leader only)
router.get(
  '/export/:semester',
  authenticate,
  authorize('secretary', 'leader'),
  [
    param('semester').notEmpty().withMessage('Semester is required'),
    query('format').optional().isIn(['csv', 'excel', 'pdf']),
  ],
  validate,
  enrollmentController.exportEnrollmentData
);

// Get waitlist for a course
router.get(
  '/course/:courseId/waitlist',
  authenticate,
  authorize('professor', 'secretary', 'leader'),
  [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  enrollmentController.getCourseWaitlist
);

// Process waitlist (move waitlisted students to enrolled)
router.post(
  '/course/:courseId/process-waitlist',
  authenticate,
  authorize('secretary'),
  [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    body('count').optional().isInt({ min: 1 }).withMessage('Count must be positive'),
  ],
  validate,
  enrollmentController.processWaitlist
);

export default router;