import { AxiosResponse } from 'axios';
import { User, Course, Task, Enrollment, AuthResponse, CourseStatistics, TaskStatistics } from './index';

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// Paginated API response
export interface PaginatedApiResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  timestamp?: string;
}

// Service method return types
export type ServiceResponse<T = any> = Promise<ApiResponse<T>>;
export type PaginatedServiceResponse<T = any> = Promise<PaginatedApiResponse<T>>;
export type ServiceMethodResult<T = any> = Promise<T>;

// Authentication service types
export interface AuthServiceMethods {
  login: (credentials: { username: string; password: string }) => ServiceResponse<AuthResponse>;
  register: (data: RegisterData) => ServiceResponse<AuthResponse>;
  logout: () => ServiceResponse<void>;
  refreshToken: (refreshToken: string) => ServiceResponse<{ accessToken: string; refreshToken: string }>;
  getCurrentUser: () => ServiceResponse<{ user: User }>;
  changePassword: (currentPassword: string, newPassword: string) => ServiceResponse<void>;
  forgotPassword: (email: string) => ServiceResponse<void>;
  resetPassword: (token: string, password: string) => ServiceResponse<void>;
}

// Course service types
export interface CourseServiceMethods {
  getCourses: (filters?: CourseFilters) => PaginatedServiceResponse<Course>;
  getCourseById: (id: string) => ServiceResponse<{ course: Course }>;
  createCourse: (data: CourseFormData) => ServiceResponse<{ course: Course }>;
  updateCourse: (id: string, data: Partial<CourseFormData>) => ServiceResponse<{ course: Course }>;
  deleteCourse: (id: string) => ServiceResponse<void>;
  submitForApproval: (id: string) => ServiceResponse<{ course: Course }>;
  approveCourse: (id: string, approved: boolean, comment?: string) => ServiceResponse<{ course: Course }>;
  publishCourse: (id: string) => ServiceResponse<{ course: Course }>;
  archiveCourse: (id: string) => ServiceResponse<{ course: Course }>;
  getCourseStatistics: (id: string) => ServiceResponse<CourseStatistics>;
  getCoursesByProfessor: (professorId: string, semester?: string) => PaginatedServiceResponse<Course>;
  batchPublishCourses: (courseIds: string[]) => ServiceResponse<{ published: string[]; failed: string[] }>;
  getMyCourses: () => PaginatedServiceResponse<Course>;
  getPendingApprovals: () => PaginatedServiceResponse<Course>;
}

// Task service types
export interface TaskServiceMethods {
  getTasks: (filters?: TaskFilters) => PaginatedServiceResponse<Task>;
  getTaskById: (id: string) => ServiceResponse<{ task: Task }>;
  createTask: (data: TaskFormData, attachments?: File[]) => ServiceResponse<{ task: Task }>;
  updateTaskResponse: (id: string, response: TaskResponse, attachments?: File[]) => ServiceResponse<{ task: Task }>;
  markAsRead: (id: string) => ServiceResponse<{ task: Task }>;
  sendReminder: (id: string, level?: 'gentle' | 'normal' | 'urgent') => ServiceResponse<void>;
  getTaskStatistics: () => ServiceResponse<TaskStatistics>;
  getOverdueTasks: () => PaginatedServiceResponse<Task>;
  batchCreateTasks: (tasks: TaskFormData[]) => ServiceResponse<{ created: string[]; failed: string[] }>;
  getTaskTemplates: () => ServiceResponse<{ templates: TaskTemplate[] }>;
  archiveCompletedTasks: (beforeDate: string) => ServiceResponse<{ archived: number }>;
  getMyTasks: (filters?: { status?: string }) => PaginatedServiceResponse<Task>;
}

// Enrollment service types
export interface EnrollmentServiceMethods {
  getEnrollments: (filters?: EnrollmentFilters) => PaginatedServiceResponse<Enrollment>;
  enrollInCourse: (courseId: string, priority?: number) => ServiceResponse<{ enrollment: Enrollment }>;
  dropCourse: (enrollmentId: string, reason?: string) => ServiceResponse<void>;
  updateEnrollmentPriority: (enrollmentId: string, priority: number) => ServiceResponse<{ enrollment: Enrollment }>;
  getMyEnrollments: (semester?: string) => PaginatedServiceResponse<Enrollment>;
  getEnrollmentStatistics: (courseId?: string) => ServiceResponse<EnrollmentStatistics>;
  processEnrollmentBatch: (semester: string) => ServiceResponse<{ processed: number; waitlisted: number }>;
}

// Analytics service types
export interface AnalyticsServiceMethods {
  getDashboardStats: () => ServiceResponse<DashboardStats>;
  getCourseAnalytics: (courseId: string, period?: string) => ServiceResponse<CourseAnalytics>;
  getUserAnalytics: (userId: string, period?: string) => ServiceResponse<UserAnalytics>;
  getSystemAnalytics: (period?: string) => ServiceResponse<SystemAnalytics>;
  generateReport: (type: string, params?: any) => ServiceResponse<{ reportUrl: string }>;
}

// Extended types for API responses
export interface RegisterData {
  username: string;
  password: string;
  email: string;
  role: string;
  userId: string;
  nameCn: string;
  nameEn: string;
  department: string;
  phone: string;
}

export interface CourseFilters {
  status?: string;
  semester?: string;
  professor?: string;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskFilters {
  type?: 'read' | 'action' | 'approval';
  status?: string;
  priority?: string;
  role?: 'sender' | 'receiver';
  page?: number;
  limit?: number;
}

export interface EnrollmentFilters {
  student?: string;
  course?: string;
  status?: string;
  semester?: string;
  page?: number;
  limit?: number;
}

export interface CourseFormData {
  courseId: string;
  nameCn: string;
  nameEn: string;
  descriptionCn: string;
  descriptionEn: string;
  credits: number;
  capacity: number;
  semester: string;
  schedule: CourseSchedule[];
  prerequisites?: string[];
  tags?: string[];
}

export interface TaskFormData {
  title: string;
  description: string;
  type: 'read' | 'action' | 'approval';
  receivers: string[];
  deadline?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedCourse?: string;
  metadata?: Record<string, any>;
}

export interface TaskResponse {
  status: 'read' | 'completed' | 'rejected';
  message?: string;
}

export interface TaskTemplate {
  _id: string;
  name: string;
  title: string;
  description: string;
  type: 'read' | 'action' | 'approval';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdBy: string;
  isActive: boolean;
}

export interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  pendingTasks: number;
  completedTasks: number;
  upcomingDeadlinesCount: number;
  workflowStatus?: {
    currentPhase: string;
    isOnSchedule: boolean;
    canProceed: boolean;
    progress: number;
    message: string;
  };
  departmentStats?: Array<{
    department: string;
    courses: number;
    students: number;
  }>;
  draftCourses?: number;
  pendingCourses?: number;
  approvedCourses?: number;
  rejectedCourses?: number;
  upcomingDeadlines?: any[];
  recentActivities?: any[];
  selectedCourses?: number;
  pendingConfirmation?: number;
  waitlisted?: number;
}

export interface CourseAnalytics {
  enrollmentTrends: Array<{ date: string; count: number }>;
  completionRates: Array<{ month: string; rate: number }>;
  studentFeedback: { average: number; count: number };
  resourceUsage: Array<{ resource: string; views: number }>;
}

export interface UserAnalytics {
  activityScore: number;
  tasksCompleted: number;
  coursesEnrolled: number;
  lastActiveDate: string;
  performanceTrends: Array<{ period: string; score: number }>;
}

export interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
  usageByRole: Record<string, number>;
}

export interface EnrollmentStatistics {
  totalEnrollments: number;
  enrollmentsByStatus: Record<string, number>;
  waitlistLength: number;
  dropoutRate: number;
  popularityScore: number;
}

export interface CourseSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  recurrence?: 'weekly' | 'biweekly' | 'monthly';
}

// Axios response wrappers
export type AxiosApiResponse<T = any> = AxiosResponse<ApiResponse<T>>;
export type AxiosPaginatedResponse<T = any> = AxiosResponse<PaginatedApiResponse<T>>;