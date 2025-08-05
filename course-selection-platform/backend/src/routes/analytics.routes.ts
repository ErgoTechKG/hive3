import { Router } from 'express';
import { query, param } from 'express-validator';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';

const router = Router();

// Dashboard statistics based on role
router.get(
  '/dashboard',
  authenticate,
  analyticsController.getDashboardStats
);

// Course analytics (secretary/leader only)
router.get(
  '/courses',
  authenticate,
  authorize('secretary', 'leader'),
  [
    query('semester').optional().isString(),
    query('department').optional().isString(),
  ],
  validate,
  analyticsController.getCourseAnalytics
);

// Enrollment analytics (secretary/leader only)
router.get(
  '/enrollments',
  authenticate,
  authorize('secretary', 'leader'),
  [
    query('semester').optional().isString(),
    query('groupBy').optional().isIn(['course', 'department', 'status']),
  ],
  validate,
  analyticsController.getEnrollmentAnalytics
);

// User activity analytics
router.get(
  '/users/activity',
  authenticate,
  authorize('secretary', 'leader'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  analyticsController.getUserActivityAnalytics
);

// Task completion analytics
router.get(
  '/tasks/completion',
  authenticate,
  authorize('secretary', 'leader'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['type', 'sender', 'receiver']),
  ],
  validate,
  analyticsController.getTaskCompletionAnalytics
);

// Professor performance analytics
router.get(
  '/professors/performance',
  authenticate,
  authorize('leader'),
  [
    query('semester').optional().isString(),
  ],
  validate,
  analyticsController.getProfessorPerformance
);

// Student success analytics
router.get(
  '/students/success',
  authenticate,
  authorize('secretary', 'leader'),
  [
    query('semester').optional().isString(),
    query('department').optional().isString(),
  ],
  validate,
  analyticsController.getStudentSuccessMetrics
);

// Course recommendation analytics (for students)
router.get(
  '/recommendations',
  authenticate,
  authorize('student'),
  analyticsController.getCourseRecommendations
);

// Annual report generation (leader only)
router.get(
  '/annual-report/:year',
  authenticate,
  authorize('leader'),
  [
    param('year').isInt({ min: 2020, max: 2050 }).withMessage('Invalid year'),
  ],
  validate,
  analyticsController.generateAnnualReport
);

// Real-time statistics
router.get(
  '/realtime',
  authenticate,
  authorize('secretary', 'leader'),
  analyticsController.getRealtimeStats
);

// Export analytics data
router.get(
  '/export',
  authenticate,
  authorize('secretary', 'leader'),
  [
    query('type').isIn(['courses', 'enrollments', 'users', 'tasks']).withMessage('Invalid export type'),
    query('format').optional().isIn(['csv', 'excel', 'pdf']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  analyticsController.exportAnalytics
);

// Predictive analytics (leader only)
router.get(
  '/predictions',
  authenticate,
  authorize('leader'),
  [
    query('type').isIn(['enrollment', 'dropout', 'capacity']).withMessage('Invalid prediction type'),
    query('semester').notEmpty().withMessage('Semester is required'),
  ],
  validate,
  analyticsController.getPredictiveAnalytics
);

export default router;