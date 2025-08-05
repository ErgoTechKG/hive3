import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import Task from '../models/Task';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { Parser } from 'json2csv';
import xlsx from 'xlsx';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// Get all users with filters and pagination
export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      role,
      department,
      isActive,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query: any = {};
    
    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Search by name or ID
    if (search) {
      query.$or = [
        { nameCn: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
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

// Get user by ID
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check permissions
    const canViewDetails = 
      req.user?.role === 'secretary' ||
      req.user?.role === 'leader' ||
      req.user?._id.toString() === id;

    if (!canViewDetails) {
      // Return limited info for other users
      res.json({
        success: true,
        data: {
          user: {
            _id: user._id,
            nameCn: user.nameCn,
            nameEn: user.nameEn,
            role: user.role,
            department: user.department,
            avatar: user.avatar
          }
        }
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check permissions
    const canEdit = 
      req.user?.role === 'secretary' ||
      req.user?.role === 'leader' ||
      req.user?._id.toString() === id;

    if (!canEdit) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.role; // Only admin can change roles
    delete updates.userId; // Cannot change user ID

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    logger.info(`User updated: ${user.username} by ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Upload avatar
export const uploadAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user?._id.toString() !== id && req.user?.role !== 'secretary' && req.user?.role !== 'leader') {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    // Process image with sharp
    const filename = `avatar-${id}-${Date.now()}.jpg`;
    const filepath = path.join('uploads', 'avatars', filename);

    await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(filepath);

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      id,
      { avatar: `/uploads/avatars/${filename}` },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { 
        avatar: user.avatar,
        user 
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user status (active/inactive)
export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    logger.info(`User status updated: ${user.username} to ${isActive ? 'active' : 'inactive'} by ${req.user?.username}`);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
export const getUserStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    let statistics: any = {
      basicInfo: {
        name: user.nameCn,
        role: user.role,
        department: user.department,
        joinDate: user.createdAt
      }
    };

    // Role-specific statistics
    if (user.role === 'student') {
      const enrollments = await Enrollment.find({ student: id })
        .populate('course', 'nameCn credits');
      
      statistics.enrollment = {
        totalCourses: enrollments.length,
        confirmedCourses: enrollments.filter(e => e.status === 'confirmed').length,
        totalCredits: enrollments
          .filter(e => e.status === 'confirmed')
          .reduce((sum, e: any) => sum + e.course.credits, 0),
        averageGrade: enrollments
          .filter(e => e.finalGrade)
          .reduce((sum, e) => sum + (e.finalGrade || 0), 0) / 
          enrollments.filter(e => e.finalGrade).length || 0
      };
    } else if (user.role === 'professor') {
      const courses = await import('../models/Course').then(m => m.default);
      const myCourses = await courses.find({ professor: id });
      
      statistics.teaching = {
        totalCourses: myCourses.length,
        publishedCourses: myCourses.filter(c => c.status === 'published').length,
        totalStudents: myCourses.reduce((sum, c) => sum + c.enrolled, 0),
        averageCapacity: myCourses.reduce((sum, c) => sum + c.capacity, 0) / myCourses.length || 0
      };
    }

    // Task statistics
    const sentTasks = await Task.countDocuments({ sender: id });
    const receivedTasks = await Task.countDocuments({ receivers: id });
    const completedTasks = await Task.countDocuments({
      receivers: id,
      'responses.userId': id,
      'responses.status': 'completed'
    });

    statistics.tasks = {
      sent: sentTasks,
      received: receivedTasks,
      completed: completedTasks,
      completionRate: receivedTasks > 0 ? 
        Math.round((completedTasks / receivedTasks) * 100) : 0
    };

    res.json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    next(error);
  }
};

// Batch import users from CSV/Excel
export const batchImportUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    let users: any[] = [];
    
    // Parse file based on type
    if (req.file.originalname.endsWith('.csv')) {
      const csvData = req.file.buffer.toString();
      // Parse CSV (implementation depends on CSV structure)
      // users = parseCSV(csvData);
    } else if (req.file.originalname.endsWith('.xlsx')) {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      users = xlsx.utils.sheet_to_json(sheet);
    }

    // Validate and create users
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const userData of users) {
      try {
        // Generate random password (should be sent to user via email)
        const tempPassword = Math.random().toString(36).slice(-8);
        
        const user = new User({
          ...userData,
          password: tempPassword
        });
        
        await user.save();
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: userData,
          error: error.message
        });
      }
    }

    logger.info(`Batch import completed: ${results.success} success, ${results.failed} failed`);

    res.json({
      success: true,
      message: 'Batch import completed',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Export users to CSV
export const exportUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, department } = req.query;

    const query: any = {};
    if (role) query.role = role;
    if (department) query.department = department;

    const users = await User.find(query)
      .select('-password -__v')
      .lean();

    // Convert to CSV
    const fields = ['userId', 'username', 'nameCn', 'nameEn', 'email', 'phone', 'role', 'department', 'isActive', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(users);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};