import { Request, Response, NextFunction } from 'express';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

// Get enrollments with filters
export const getEnrollments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      student,
      course,
      semester,
      status,
      page = 1,
      limit = 20
    } = req.query;

    // Build query based on user role
    const query: any = {};
    
    // Students can only see their own enrollments
    if (req.user?.role === 'student') {
      query.student = req.user._id;
    } else {
      if (student) query.student = student;
    }
    
    if (course) query.course = course;
    if (semester) query.semester = semester;
    if (status) query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate('student', 'nameCn nameEn userId department')
      .populate('course', 'nameCn nameEn courseId credits professor')
      .populate({
        path: 'course',
        populate: {
          path: 'professor',
          select: 'nameCn nameEn'
        }
      })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Enrollment.countDocuments(query);

    res.json({
      success: true,
      data: {
        enrollments,
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

// Get enrollment by ID
export const getEnrollmentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findById(id)
      .populate('student', 'nameCn nameEn userId department')
      .populate('course', 'nameCn nameEn courseId credits schedule')
      .populate('preferences.courseId', 'nameCn courseId');

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
      return;
    }

    // Check access permissions
    const canAccess = 
      req.user?.role === 'secretary' ||
      req.user?.role === 'leader' ||
      enrollment.student._id.toString() === req.user?._id.toString() ||
      (await Course.findById(enrollment.course)).professor.toString() === req.user?._id.toString();

    if (!canAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: { enrollment }
    });
  } catch (error) {
    next(error);
  }
};

// Submit course preferences (students only)
export const submitPreferences = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semester, preferences } = req.body;
    const studentId = req.user?._id;

    // Check if preferences already submitted
    const existingPreferences = await Enrollment.find({
      student: studentId,
      semester,
      status: { $ne: 'dropped' }
    });

    if (existingPreferences.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Preferences already submitted for this semester'
      });
      return;
    }

    // Validate course availability
    for (const pref of preferences) {
      const course = await Course.findById(pref.courseId);
      if (!course || course.status !== 'published' || course.semester !== semester) {
        res.status(400).json({
          success: false,
          message: `Invalid course: ${pref.courseId}`
        });
        return;
      }
    }

    // Create enrollment records
    const enrollments = await Promise.all(
      preferences.map(async (pref: any, index: number) => {
        const enrollment = new Enrollment({
          student: studentId,
          course: preferences[0].courseId, // Primary choice
          semester,
          preferences: preferences.map((p: any, i: number) => ({
            courseId: p.courseId,
            rank: i + 1,
            reason: p.reason
          })),
          status: 'pending'
        });
        
        return enrollment.save();
      })
    );

    logger.info(`Preferences submitted by student ${req.user?.username} for ${semester}`);

    res.status(201).json({
      success: true,
      message: 'Preferences submitted successfully',
      data: { enrollments: enrollments[0] } // Return the primary enrollment
    });
  } catch (error) {
    next(error);
  }
};

// Update preferences (before deadline)
export const updatePreferences = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semester, preferences } = req.body;
    const studentId = req.user?._id;

    // Find existing enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      semester,
      status: 'pending'
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'No pending preferences found'
      });
      return;
    }

    // Update preferences
    enrollment.preferences = preferences.map((p: any, i: number) => ({
      courseId: p.courseId,
      rank: i + 1,
      reason: p.reason
    }));

    await enrollment.save();

    logger.info(`Preferences updated by student ${req.user?.username} for ${semester}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { enrollment }
    });
  } catch (error) {
    next(error);
  }
};

// Run course matching algorithm (secretary only)
export const runMatchingAlgorithm = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semester, algorithm = 'priority' } = req.body;

    // Get all pending enrollments
    const pendingEnrollments = await Enrollment.find({
      semester,
      status: 'pending'
    }).populate('preferences.courseId');

    // Get all published courses for the semester
    const courses = await Course.find({
      semester,
      status: 'published'
    });

    // Create course capacity map
    const courseCapacity = new Map();
    const courseEnrolled = new Map();
    
    courses.forEach(course => {
      courseCapacity.set(course._id.toString(), course.capacity);
      courseEnrolled.set(course._id.toString(), 0);
    });

    // Simple priority-based matching algorithm
    const results = {
      matched: 0,
      waitlisted: 0,
      rejected: 0
    };

    // Sort enrollments by submission time (first-come-first-served within priority)
    pendingEnrollments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const enrollment of pendingEnrollments) {
      let matched = false;

      // Try to match based on preferences
      for (const preference of enrollment.preferences) {
        const courseId = preference.courseId.toString();
        const enrolled = courseEnrolled.get(courseId) || 0;
        const capacity = courseCapacity.get(courseId) || 0;

        if (enrolled < capacity) {
          // Match successful
          enrollment.course = preference.courseId;
          enrollment.status = 'selected';
          enrollment.selectedAt = new Date();
          courseEnrolled.set(courseId, enrolled + 1);
          matched = true;
          results.matched++;
          break;
        }
      }

      if (!matched) {
        // Try waitlist for first preference
        const firstChoice = enrollment.preferences[0].courseId;
        enrollment.course = firstChoice;
        enrollment.status = 'waitlisted';
        results.waitlisted++;
      }

      await enrollment.save();
    }

    // Update course enrollment counts
    for (const [courseId, enrolled] of courseEnrolled) {
      await Course.findByIdAndUpdate(courseId, { enrolled });
    }

    logger.info(`Matching algorithm completed for ${semester}: ${results.matched} matched, ${results.waitlisted} waitlisted`);

    res.json({
      success: true,
      message: 'Matching algorithm completed',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Confirm enrollment (students only)
export const confirmEnrollment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
      return;
    }

    // Check ownership
    if (enrollment.student.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    if (enrollment.status !== 'selected') {
      res.status(400).json({
        success: false,
        message: 'Only selected enrollments can be confirmed'
      });
      return;
    }

    enrollment.status = 'confirmed';
    enrollment.confirmedAt = new Date();
    await enrollment.save();

    logger.info(`Enrollment confirmed by student ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Enrollment confirmed successfully',
      data: { enrollment }
    });
  } catch (error) {
    next(error);
  }
};

// Drop course (students only)
export const dropCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
      return;
    }

    // Check ownership
    if (enrollment.student.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    if (!['confirmed', 'selected'].includes(enrollment.status)) {
      res.status(400).json({
        success: false,
        message: 'Cannot drop this enrollment'
      });
      return;
    }

    // Update enrollment
    enrollment.status = 'dropped';
    enrollment.rejectedAt = new Date();
    enrollment.rejectedReason = reason;
    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(enrollment.course, {
      $inc: { enrolled: -1 }
    });

    // Process waitlist if any
    const waitlisted = await Enrollment.findOne({
      course: enrollment.course,
      status: 'waitlisted'
    }).sort({ createdAt: 1 });

    if (waitlisted) {
      waitlisted.status = 'selected';
      waitlisted.selectedAt = new Date();
      await waitlisted.save();
      
      await Course.findByIdAndUpdate(enrollment.course, {
        $inc: { enrolled: 1 }
      });
    }

    logger.info(`Course dropped by student ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Course dropped successfully',
      data: { enrollment }
    });
  } catch (error) {
    next(error);
  }
};

// Professor review of student application
export const professorReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { approved, comment } = req.body;

    const enrollment = await Enrollment.findById(id).populate('course');
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
      return;
    }

    // Check if professor owns the course
    const course = await Course.findById(enrollment.course);
    if (course?.professor.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    enrollment.professorApproval = {
      approved,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      comment
    };

    if (!approved) {
      enrollment.status = 'rejected';
      enrollment.rejectedAt = new Date();
      enrollment.rejectedReason = comment;
    }

    await enrollment.save();

    logger.info(`Enrollment reviewed by professor ${req.user?.username}`);

    res.json({
      success: true,
      message: `Application ${approved ? 'approved' : 'rejected'}`,
      data: { enrollment }
    });
  } catch (error) {
    next(error);
  }
};

// Get enrollment statistics
export const getEnrollmentStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semester } = req.params;

    const stats = await Enrollment.aggregate([
      { $match: { semester } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const courseStats = await Enrollment.aggregate([
      { $match: { semester } },
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          }
        }
      }
    ]);

    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const submittedPreferences = await Enrollment.distinct('student', { semester });

    res.json({
      success: true,
      data: {
        totalStudents,
        submittedPreferences: submittedPreferences.length,
        pendingSubmissions: totalStudents - submittedPreferences.length,
        statusDistribution: stats,
        courseDistribution: courseStats,
        matchingRate: Math.round(
          (stats.find(s => s._id === 'confirmed')?.count || 0) / 
          submittedPreferences.length * 100
        ) || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export enrollment data
export const exportEnrollmentData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semester } = req.params;
    const { format = 'csv' } = req.query;

    const enrollments = await Enrollment.find({ semester })
      .populate('student', 'nameCn nameEn userId department')
      .populate('course', 'nameCn courseId credits')
      .lean();

    if (format === 'csv') {
      const fields = [
        'student.userId',
        'student.nameCn',
        'student.department',
        'course.courseId',
        'course.nameCn',
        'course.credits',
        'status',
        'confirmedAt'
      ];
      
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(enrollments);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=enrollments-${semester}.csv`);
      res.send(csv);
    } else if (format === 'pdf') {
      // PDF generation would go here
      res.status(501).json({
        success: false,
        message: 'PDF export not implemented yet'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get course waitlist
export const getCourseWaitlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;

    const waitlist = await Enrollment.find({
      course: courseId,
      status: 'waitlisted'
    })
    .populate('student', 'nameCn nameEn userId')
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: { waitlist }
    });
  } catch (error) {
    next(error);
  }
};

// Process waitlist
export const processWaitlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { count = 1 } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    const availableSlots = course.capacity - course.enrolled;
    const slotsToFill = Math.min(count, availableSlots);

    const waitlisted = await Enrollment.find({
      course: courseId,
      status: 'waitlisted'
    })
    .sort({ createdAt: 1 })
    .limit(slotsToFill);

    let processed = 0;
    for (const enrollment of waitlisted) {
      enrollment.status = 'selected';
      enrollment.selectedAt = new Date();
      await enrollment.save();
      processed++;
    }

    if (processed > 0) {
      await Course.findByIdAndUpdate(courseId, {
        $inc: { enrolled: processed }
      });
    }

    logger.info(`Processed ${processed} waitlisted students for course ${courseId}`);

    res.json({
      success: true,
      message: `Processed ${processed} students from waitlist`,
      data: { processed }
    });
  } catch (error) {
    next(error);
  }
};

// Get my enrollments (for students)
export const getMyEnrollments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const enrollments = await Enrollment.find({ student: req.user?._id })
      .populate('course', 'nameCn nameEn courseId credits schedule professor')
      .populate({
        path: 'course',
        populate: {
          path: 'professor',
          select: 'nameCn nameEn'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};

// Get pending reviews (for professors)
export const getPendingReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Find courses taught by this professor
    const courses = await Course.find({ 
      professor: req.user?._id,
      status: 'published'
    });

    const courseIds = courses.map(c => c._id);

    // Find enrollments needing review
    const pendingReviews = await Enrollment.find({
      course: { $in: courseIds },
      status: 'selected',
      'professorApproval.approved': { $exists: false }
    })
    .populate('student', 'nameCn nameEn userId department')
    .populate('course', 'nameCn courseId');

    res.json({
      success: true,
      data: pendingReviews
    });
  } catch (error) {
    next(error);
  }
};