import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Task from '../models/Task';
import logger from '../utils/logger';
import { Parser } from 'json2csv';
import { subMonths } from 'date-fns';

// Get dashboard statistics based on role
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role } = req.user!;
    let stats: any = {};

    switch (role) {
      case 'student':
        stats = await getStudentStats(req.user!._id as string);
        break;
      case 'professor':
        stats = await getProfessorStats(req.user!._id as string);
        break;
      case 'secretary':
        stats = await getSecretaryStats();
        break;
      case 'leader':
        stats = await getLeaderStats();
        break;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Student-specific statistics
async function getStudentStats(userId: string) {
  const currentSemester = '2025-Spring';

  // Enrollment statistics
  const enrollments = await Enrollment.find({ 
    student: userId,
    semester: currentSemester 
  }).populate('course');

  const enrolledCourses = enrollments.filter(e => e.status === 'confirmed').length;
  const totalCredits = enrollments
    .filter(e => e.status === 'confirmed')
    .reduce((sum, e: any) => sum + e.course.credits, 0);

  // Task statistics
  const pendingTasks = await Task.countDocuments({
    receivers: userId,
    status: { $in: ['pending', 'in_progress'] }
  });

  // Study groups (mock data for now)
  const studyGroups = 2;

  // Weekly hours calculation
  const weeklyHours = enrollments
    .filter(e => e.status === 'confirmed')
    .reduce((sum, e: any) => {
      return sum + e.course.schedule.reduce((hrs: number, _s: any) => hrs + 2, 0);
    }, 0);

  // Upcoming deadlines
  const upcomingDeadlines = await Task.find({
    receivers: userId,
    deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    status: { $ne: 'completed' }
  }).limit(5);

  return {
    stats: {
      enrolledCourses,
      totalCredits,
      pendingTasks,
      studyGroups,
      weeklyHours,
      selectedCourses: enrollments.filter(e => e.status === 'selected').length,
      pendingConfirmation: enrollments.filter(e => e.status === 'selected').length,
      waitlisted: enrollments.filter(e => e.status === 'waitlisted').length
    },
    upcomingDeadlines,
    recentActivities: []
  };
}

// Professor-specific statistics
async function getProfessorStats(userId: string) {
  const courses = await Course.find({ professor: userId });
  const courseIds = courses.map(c => c._id);

  // Student statistics
  const totalStudents = courses.reduce((sum, c) => sum + c.enrolled, 0);
  
  // Application statistics
  const pendingApplications = await Enrollment.countDocuments({
    course: { $in: courseIds },
    status: 'selected',
    'professorApproval.approved': { $exists: false }
  });

  // Course ratings (mock for now)
  const averageRating = 4.5;

  // Weekly activity
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const applications = await Enrollment.countDocuments({
      course: { $in: courseIds },
      createdAt: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    });

    weeklyActivity.push({ date, applications, confirmed: Math.floor(applications * 0.8) });
  }

  return {
    stats: {
      totalCourses: courses.length,
      totalStudents,
      pendingApplications,
      averageRating,
      publishedCourses: courses.filter(c => c.status === 'published').length,
      draftCourses: courses.filter(c => c.status === 'draft').length
    },
    weeklyActivity,
    studentPerformance: []
  };
}

// Secretary-specific statistics
async function getSecretaryStats() {
  const currentSemester = '2025-Spring';

  // Course statistics
  const courseStats = await Course.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats: any = {
    draftCourses: 0,
    pendingApproval: 0,
    approvedCourses: 0,
    publishedCourses: 0
  };

  courseStats.forEach(stat => {
    switch (stat._id) {
      case 'draft': stats.draftCourses = stat.count; break;
      case 'pending_approval': stats.pendingApproval = stat.count; break;
      case 'approved': stats.approvedCourses = stat.count; break;
      case 'published': stats.publishedCourses = stat.count; break;
    }
  });

  // Student assignment statistics
  const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
  const assignedStudents = await Enrollment.distinct('student', {
    semester: currentSemester,
    status: { $in: ['confirmed', 'selected'] }
  });
  stats.unassignedStudents = totalStudents - assignedStudents.length;

  // Task completion
  const totalTasks = await Task.countDocuments({ sender: { $exists: true } });
  const completedTasks = await Task.countDocuments({ status: 'completed' });
  stats.taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // System load (mock)
  stats.systemLoad = 65;

  // Workflow status
  const workflowStatus = {
    currentPhase: '选课匹配',
    progress: 75,
    isOnSchedule: true,
    canProceed: true,
    message: '准备运行选课匹配算法'
  };

  // Department statistics
  const departmentStats = await User.aggregate([
    { $match: { role: 'student' } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    stats,
    workflowStatus,
    departmentStats
  };
}

// Leader-specific statistics
async function getLeaderStats() {
  // KPIs
  const kpis = {
    systemHealth: 92,
    systemHealthTrend: '+5%',
    qualityIndex: 87,
    qualityTrend: '+3%',
    resourceUtilization: 78,
    satisfactionScore: 4.3
  };

  // Overall statistics
  const totalCourses = await Course.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalProfessors = await User.countDocuments({ role: 'professor' });

  // Credit distribution
  const courses = await Course.find();
  const lowCreditCourses = courses.filter(c => c.credits <= 2).length;
  const midCreditCourses = courses.filter(c => c.credits > 2 && c.credits <= 4).length;
  const highCreditCourses = courses.filter(c => c.credits > 4).length;

  // Calculate other metrics
  const avgCourseCapacity = courses.reduce((sum, c) => sum + c.capacity, 0) / courses.length || 0;
  const studentTeacherRatio = Math.round(totalStudents / totalProfessors) || 0;

  // Monthly trends
  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    monthly.push({
      date,
      courses: Math.floor(Math.random() * 50 + 100),
      students: Math.floor(Math.random() * 200 + 800),
      satisfaction: Math.random() * 0.5 + 4
    });
  }

  return {
    kpis,
    stats: {
      totalCourses,
      totalStudents,
      totalProfessors,
      lowCreditCourses,
      midCreditCourses,
      highCreditCourses,
      avgCourseCapacity: Math.round(avgCourseCapacity),
      studentTeacherRatio,
      courseCompletionRate: 88,
      innovativeCourseRatio: 23
    },
    trends: { monthly },
    alerts: []
  };
}

// Get course analytics
export const getCourseAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semester, department } = req.query;

    const query: any = {};
    if (semester) query.semester = semester;
    if (department) {
      const professors = await User.find({ department, role: 'professor' });
      query.professor = { $in: professors.map(p => p._id) };
    }

    const courses = await Course.find(query)
      .populate('professor', 'nameCn department');

    const analytics = {
      totalCourses: courses.length,
      totalCapacity: courses.reduce((sum, c) => sum + c.capacity, 0),
      totalEnrolled: courses.reduce((sum, c) => sum + c.enrolled, 0),
      averageUtilization: courses.length > 0 ? 
        courses.reduce((sum, c) => sum + (c.enrolled / c.capacity), 0) / courses.length * 100 : 0,
      byStatus: await Course.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      byCredits: await Course.aggregate([
        { $match: query },
        { $group: { _id: '$credits', count: { $sum: 1 } } }
      ])
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// Get enrollment analytics
export const getEnrollmentAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semester, groupBy = 'status' } = req.query;

    const matchStage: any = {};
    if (semester) matchStage.semester = semester;

    let groupStage: any;
    switch (groupBy) {
      case 'course':
        groupStage = {
          _id: '$course',
          count: { $sum: 1 },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } }
        };
        break;
      case 'department':
        groupStage = {
          _id: '$student.department',
          count: { $sum: 1 }
        };
        break;
      default:
        groupStage = {
          _id: '$status',
          count: { $sum: 1 }
        };
    }

    const analytics = await Enrollment.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $group: groupStage }
    ]);

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
};

// Get user activity analytics
export const getUserActivityAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const loginActivity = await User.aggregate([
      {
        $match: {
          lastLogin: dateFilter
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$lastLogin' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: { loginActivity }
    });
  } catch (error) {
    next(error);
  }
};

// Get task completion analytics
export const getTaskCompletionAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, groupBy = 'type' } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchStage: any = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    const groupField = groupBy === 'sender' ? '$sender' : 
                      groupBy === 'receiver' ? '$receivers' : '$type';

    const analytics = await Task.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupField,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
};

// Get professor performance metrics
export const getProfessorPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semester } = req.query;

    const professors = await User.find({ role: 'professor' });
    
    const performance = await Promise.all(
      professors.map(async (prof) => {
        const courses = await Course.find({ 
          professor: prof._id,
          ...(semester && { semester })
        });

        const totalStudents = courses.reduce((sum, c) => sum + c.enrolled, 0);
        const avgUtilization = courses.length > 0 ?
          courses.reduce((sum, c) => sum + (c.enrolled / c.capacity), 0) / courses.length * 100 : 0;

        return {
          professor: {
            _id: prof._id,
            name: prof.nameCn,
            department: prof.department
          },
          totalCourses: courses.length,
          totalStudents,
          avgUtilization: Math.round(avgUtilization),
          publishedCourses: courses.filter(c => c.status === 'published').length
        };
      })
    );

    res.json({
      success: true,
      data: { performance }
    });
  } catch (error) {
    next(error);
  }
};

// Get student success metrics
export const getStudentSuccessMetrics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { semester, department } = req.query;

    const query: any = { role: 'student' };
    if (department) query.department = department;

    const students = await User.find(query);
    const studentIds = students.map(s => s._id);

    const enrollmentStats = await Enrollment.aggregate([
      {
        $match: {
          student: { $in: studentIds },
          ...(semester && { semester })
        }
      },
      {
        $group: {
          _id: '$student',
          totalCourses: { $sum: 1 },
          confirmedCourses: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          avgGrade: { $avg: '$finalGrade' }
        }
      }
    ]);

    const taskStats = await Task.aggregate([
      {
        $match: {
          receivers: { $in: studentIds }
        }
      },
      {
        $group: {
          _id: '$receivers',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: {
              $cond: [
                { $in: ['$status', ['completed', 'read']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        enrollmentStats,
        taskStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get course recommendations for students
export const getCourseRecommendations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentId = req.user?._id;

    // Get student's completed courses
    const completedEnrollments = await Enrollment.find({
      student: studentId,
      status: 'confirmed',
      finalGrade: { $exists: true }
    }).populate('course');

    // Get courses with similar tags/prerequisites
    const completedCourseIds = completedEnrollments.map(e => e.course._id);
    const tags = completedEnrollments.reduce((acc: string[], e: any) => {
      return acc.concat(e.course.tags || []);
    }, []);

    const recommendations = await Course.find({
      _id: { $nin: completedCourseIds },
      status: 'published',
      $or: [
        { tags: { $in: tags } },
        { prerequisites: { $in: completedCourseIds.map(id => id.toString()) } }
      ]
    })
    .populate('professor', 'nameCn nameEn')
    .limit(10);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

// Generate annual report
export const generateAnnualReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { year } = req.params;
    const yearStr = year || '2025';

    // Comprehensive annual statistics
    const report = {
      year: parseInt(yearStr),
      summary: {
        totalCourses: await Course.countDocuments({
          createdAt: {
            $gte: new Date(`${yearStr}-01-01`),
            $lt: new Date(`${parseInt(yearStr) + 1}-01-01`)
          }
        }),
        totalStudents: await User.countDocuments({ role: 'student' }),
        totalProfessors: await User.countDocuments({ role: 'professor' }),
        totalEnrollments: await Enrollment.countDocuments({
          createdAt: {
            $gte: new Date(`${yearStr}-01-01`),
            $lt: new Date(`${parseInt(yearStr) + 1}-01-01`)
          }
        })
      },
      courseAnalysis: await Course.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${yearStr}-01-01`),
              $lt: new Date(`${parseInt(yearStr) + 1}-01-01`)
            }
          }
        },
        {
          $group: {
            _id: '$semester',
            count: { $sum: 1 },
            totalCapacity: { $sum: '$capacity' },
            totalEnrolled: { $sum: '$enrolled' }
          }
        }
      ]),
      qualityMetrics: {
        avgCourseRating: 4.3,
        studentSatisfaction: 86,
        completionRate: 92,
        innovationIndex: 78
      }
    };

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

// Get real-time statistics
export const getRealtimeStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const stats = {
      activeUsers: await User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
      }),
      todayEnrollments: await Enrollment.countDocuments({
        createdAt: { $gte: todayStart }
      }),
      todayTasks: await Task.countDocuments({
        createdAt: { $gte: todayStart }
      }),
      pendingApprovals: await Course.countDocuments({
        status: 'pending_approval'
      })
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Export analytics data
export const exportAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, format = 'csv' } = req.query;
    const { startDate: _startDate, endDate: _endDate } = req.query;

    let data: any[];
    
    switch (type) {
      case 'courses':
        data = await Course.find().lean();
        break;
      case 'enrollments':
        data = await Enrollment.find().populate('student course').lean();
        break;
      case 'users':
        data = await User.find().select('-password').lean();
        break;
      case 'tasks':
        data = await Task.find().lean();
        break;
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
        return;
    }

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
      res.send(csv);
    } else {
      res.status(501).json({
        success: false,
        message: 'Export format not implemented'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get predictive analytics
export const getPredictiveAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type } = req.query;
    const { semester: _semester } = req.query;

    // Mock predictive data
    const predictions = {
      enrollment: {
        expectedTotal: 1200,
        expectedGrowth: 15,
        hotCourses: ['CS101', 'MATH201', 'ENG301'],
        capacityNeeded: 1500
      },
      dropout: {
        riskStudents: 45,
        riskFactors: ['Low attendance', 'Poor grades', 'No engagement'],
        preventionSuccess: 78
      },
      capacity: {
        shortageAreas: ['Computer Science', 'Mathematics'],
        surplusAreas: ['History', 'Geography'],
        recommendedAdjustments: 12
      }
    };

    res.json({
      success: true,
      data: predictions[type as keyof typeof predictions] || {}
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions for specific reports
export const getAnnualMetrics = async (year: number) => {
  return {
    courses: await Course.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      }
    }),
    enrollments: await Enrollment.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      }
    })
  };
};

export const getDepartmentComparison = async () => {
  const departments = await User.distinct('department', { role: 'professor' });
  
  return {
    data: departments.map(dept => ({
      name: dept,
      courseQuality: Math.random() * 30 + 70,
      studentSatisfaction: Math.random() * 20 + 80,
      completionRate: Math.random() * 10 + 90,
      innovationIndex: Math.random() * 40 + 60,
      researchOutput: Math.random() * 50 + 50
    }))
  };
};

export const getCourseQualityMetrics = async () => {
  const courses = await Course.find({ status: 'published' })
    .populate('professor', 'nameCn department')
    .limit(20);

  return {
    data: courses.map(course => ({
      _id: course._id,
      nameCn: course.nameCn,
      professor: course.professor,
      department: (course.professor as any).department,
      rating: Math.random() * 2 + 3,
      completionRate: Math.random() * 20 + 80,
      innovationIndex: Math.random() * 40 + 60,
      qualityGrade: Math.random() > 0.7 ? 'A' : 'B'
    }))
  };
};

export const getUnassignedStudents = async () => {
  const allStudents = await User.find({ role: 'student', isActive: true });
  const assignedStudentIds = await Enrollment.distinct('student', {
    semester: '2025-Spring',
    status: { $in: ['confirmed', 'selected'] }
  });

  const unassignedStudents = allStudents.filter(
    student => !assignedStudentIds.some(id => id.toString() === (student._id as any).toString())
  );

  return { data: unassignedStudents };
};

export const exportQualityReport = async () => {
  // Implementation for quality report export
  logger.info('Quality report export requested');
};