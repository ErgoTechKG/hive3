import { Response, NextFunction } from 'express';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

// Get all courses with filters and pagination
export const getCourses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      status,
      semester,
      professor,
      tags,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query: any = {};
    
    if (status) query.status = status;
    if (semester) query.semester = semester;
    if (professor) query.professor = professor;
    if (tags) query.tags = { $in: (tags as string).split(',') };
    
    // Text search
    if (search) {
      query.$or = [
        { nameCn: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { descriptionCn: { $regex: search, $options: 'i' } },
        { descriptionEn: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user?.role === 'student') {
      // Students can only see published courses
      query.status = 'published';
    } else if (req.user?.role === 'professor' && !status) {
      // Professors see their own courses regardless of status
      query.$or = [
        { status: 'published' },
        { professor: (req.user as any)._id }
      ];
    }

    const courses = await Course.find(query)
      .populate('professor', 'nameCn nameEn department')
      .populate('approvedBy', 'nameCn nameEn')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
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

// Get course by ID
export const getCourseById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('professor', 'nameCn nameEn department email')
      .populate('approvedBy', 'nameCn nameEn');

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Check access permissions
    if (req.user?.role === 'student' && course.status !== 'published') {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// Create new course
export const createCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseData = {
      ...req.body,
      professor: req.user?._id,
      status: 'draft'
    };

    const course = new Course(courseData);
    await course.save();

    await course.populate('professor', 'nameCn nameEn department');

    logger.info(`Course created: ${course.courseId} by ${req.user?.username}`);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// Update course
export const updateCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Check permissions
    const canEdit = 
      req.user?.role === 'secretary' ||
      req.user?.role === 'leader' ||
      (req.user?.role === 'professor' && course.professor.toString() === (req.user._id as any).toString());

    if (!canEdit) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Don't allow status changes through regular update
    delete updates.status;

    Object.assign(course, updates);
    await course.save();

    await course.populate('professor', 'nameCn nameEn department');

    logger.info(`Course updated: ${course.courseId} by ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// Delete course
export const deleteCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Check permissions
    const canDelete = 
      req.user?.role === 'secretary' ||
      req.user?.role === 'leader' ||
      (req.user?.role === 'professor' && course.professor.toString() === (req.user._id as any).toString());

    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Don't delete if there are enrollments
    const enrollmentCount = await Enrollment.countDocuments({ course: id });
    if (enrollmentCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete course with enrollments'
      });
      return;
    }

    await course.deleteOne();

    logger.info(`Course deleted: ${course.courseId} by ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Submit course for approval
export const submitForApproval = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Check ownership
    if (course.professor.toString() !== (req.user?._id as any).toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    if (course.status !== 'draft') {
      res.status(400).json({
        success: false,
        message: 'Course must be in draft status to submit for approval'
      });
      return;
    }

    course.status = 'pending_approval';
    await course.save();

    logger.info(`Course submitted for approval: ${course.courseId}`);

    res.json({
      success: true,
      message: 'Course submitted for approval',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// Approve or reject course
export const approveCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { approved, comment: _comment } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    if (course.status !== 'pending_approval') {
      res.status(400).json({
        success: false,
        message: 'Course is not pending approval'
      });
      return;
    }

    course.status = approved ? 'approved' : 'draft';
    course.approvedBy = req.user?._id as any;
    course.approvedAt = new Date();

    await course.save();

    logger.info(`Course ${approved ? 'approved' : 'rejected'}: ${course.courseId} by ${req.user?.username}`);

    res.json({
      success: true,
      message: `Course ${approved ? 'approved' : 'rejected'} successfully`,
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// Publish course
export const publishCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    if (course.status !== 'approved') {
      res.status(400).json({
        success: false,
        message: 'Course must be approved before publishing'
      });
      return;
    }

    course.status = 'published';
    course.publishedAt = new Date();
    await course.save();

    logger.info(`Course published: ${course.courseId} by ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Course published successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// Archive course
export const archiveCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    course.status = 'archived';
    await course.save();

    logger.info(`Course archived: ${course.courseId} by ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Course archived successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// Get course statistics
export const getCourseStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Get enrollment statistics
    const enrollments = await Enrollment.find({ course: id });
    const statusCounts = enrollments.reduce((acc: any, enrollment) => {
      acc[enrollment.status] = (acc[enrollment.status] || 0) + 1;
      return acc;
    }, {});

    const statistics = {
      capacity: course.capacity,
      enrolled: course.enrolled,
      availableSeats: course.capacity - course.enrolled,
      enrollmentRate: (course.enrolled / course.capacity) * 100,
      statusBreakdown: statusCounts,
      totalApplications: enrollments.length
    };

    res.json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    next(error);
  }
};

// Get courses by professor
export const getCoursesByProfessor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { professorId } = req.params;
    const { semester } = req.query;

    const query: any = { professor: professorId };
    if (semester) query.semester = semester;

    const courses = await Course.find(query)
      .populate('professor', 'nameCn nameEn department')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    next(error);
  }
};

// Batch publish courses
export const batchPublishCourses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseIds } = req.body;

    const result = await Course.updateMany(
      { 
        _id: { $in: courseIds },
        status: 'approved'
      },
      { 
        status: 'published',
        publishedAt: new Date()
      }
    );

    logger.info(`Batch published ${result.modifiedCount} courses by ${req.user?.username}`);

    res.json({
      success: true,
      message: `Published ${result.modifiedCount} courses`,
      data: { 
        publishedCount: result.modifiedCount,
        totalCount: courseIds.length
      }
    });
  } catch (error) {
    next(error);
  }
};