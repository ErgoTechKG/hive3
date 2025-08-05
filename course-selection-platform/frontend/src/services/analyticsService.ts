import axios from '../utils/axios';
import { ApiResponse } from '../types';

interface AnalyticsFilters {
  semester?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}

interface PredictiveOptions {
  type: 'enrollment' | 'dropout' | 'capacity';
  semester: string;
}

interface DashboardStats {
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

interface CourseAnalytics {
  enrollmentTrends: Array<{ date: string; count: number }>;
  completionRates: Array<{ month: string; rate: number }>;
  studentFeedback: { average: number; count: number };
  resourceUsage: Array<{ resource: string; views: number }>;
}

interface EnrollmentAnalytics {
  totalEnrollments: number;
  enrollmentsByPeriod: Array<{ period: string; count: number }>;
  enrollmentsByDepartment: Record<string, number>;
  popularCourses: Array<{ courseId: string; courseName: string; enrollments: number }>;
}

interface UserActivityAnalytics {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  loginFrequency: Array<{ date: string; logins: number }>;
}

interface TaskCompletionAnalytics {
  totalTasks: number;
  completedTasks: number;
  averageCompletionTime: number;
  tasksByType: Record<string, number>;
  overdueTasks: number;
}

const analyticsService = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await axios.get<ApiResponse<DashboardStats>>('/analytics/dashboard');
    return response.data;
  },

  getCourseAnalytics: async (filters?: AnalyticsFilters): Promise<ApiResponse<CourseAnalytics[]>> => {
    const response = await axios.get<ApiResponse<CourseAnalytics[]>>('/analytics/courses', { params: filters });
    return response.data;
  },

  getEnrollmentAnalytics: async (filters?: AnalyticsFilters): Promise<ApiResponse<EnrollmentAnalytics>> => {
    const response = await axios.get<ApiResponse<EnrollmentAnalytics>>('/analytics/enrollments', { params: filters });
    return response.data;
  },

  getUserActivityAnalytics: async (startDate?: string, endDate?: string): Promise<ApiResponse<UserActivityAnalytics>> => {
    const response = await axios.get<ApiResponse<UserActivityAnalytics>>('/analytics/users/activity', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getTaskCompletionAnalytics: async (filters?: AnalyticsFilters): Promise<ApiResponse<TaskCompletionAnalytics>> => {
    const response = await axios.get<ApiResponse<TaskCompletionAnalytics>>('/analytics/tasks/completion', { params: filters });
    return response.data;
  },

  getProfessorPerformance: async (semester?: string): Promise<ApiResponse<Array<{ professorId: string; performance: number; courses: number }>>> => {
    const response = await axios.get<ApiResponse<Array<{ professorId: string; performance: number; courses: number }>>>('/analytics/professors/performance', {
      params: { semester },
    });
    return response.data;
  },

  getStudentSuccessMetrics: async (filters?: AnalyticsFilters): Promise<ApiResponse<{ successRate: number; metrics: Record<string, number> }>> => {
    const response = await axios.get<ApiResponse<{ successRate: number; metrics: Record<string, number> }>>('/analytics/students/success', { params: filters });
    return response.data;
  },

  getCourseRecommendations: async (): Promise<ApiResponse<Array<{ courseId: string; score: number; reason: string }>>> => {
    const response = await axios.get<ApiResponse<Array<{ courseId: string; score: number; reason: string }>>>('/analytics/recommendations');
    return response.data;
  },

  generateAnnualReport: async (year: number): Promise<ApiResponse<{ reportUrl: string; reportId: string }>> => {
    const response = await axios.get<ApiResponse<{ reportUrl: string; reportId: string }>>(`/analytics/annual-report/${year}`);
    return response.data;
  },

  getRealtimeStats: async (): Promise<ApiResponse<{ activeUsers: number; systemLoad: number; timestamp: string }>> => {
    const response = await axios.get<ApiResponse<{ activeUsers: number; systemLoad: number; timestamp: string }>>('/analytics/realtime');
    return response.data;
  },

  exportAnalytics: async (type: string, format?: string, filters?: AnalyticsFilters): Promise<Blob | ApiResponse<{ downloadUrl: string }>> => {
    const response = await axios.get('/analytics/export', {
      params: { type, format, ...filters },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },

  getPredictiveAnalytics: async (options: PredictiveOptions): Promise<ApiResponse<{ predictions: Array<{ date: string; value: number; confidence: number }> }>> => {
    const response = await axios.get<ApiResponse<{ predictions: Array<{ date: string; value: number; confidence: number }> }>>('/analytics/predictions', { params: options });
    return response.data;
  },

  getAnnualMetrics: async (year: number): Promise<ApiResponse<Record<string, number>>> => {
    const response = await axios.get<ApiResponse<Record<string, number>>>(`/analytics/annual-metrics/${year}`);
    return response.data;
  },

  getDepartmentComparison: async (): Promise<ApiResponse<Array<{ department: string; metrics: Record<string, number> }>>> => {
    const response = await axios.get<ApiResponse<Array<{ department: string; metrics: Record<string, number> }>>>('/analytics/department-comparison');
    return response.data;
  },

  getCourseQualityMetrics: async (): Promise<ApiResponse<Array<{ courseId: string; qualityScore: number; feedback: number }>>> => {
    const response = await axios.get<ApiResponse<Array<{ courseId: string; qualityScore: number; feedback: number }>>>('/analytics/course-quality');
    return response.data;
  },

  getUnassignedStudents: async (): Promise<ApiResponse<Array<{ studentId: string; semester: string; preferences: string[] }>>> => {
    const response = await axios.get<ApiResponse<Array<{ studentId: string; semester: string; preferences: string[] }>>>('/analytics/unassigned-students');
    return response.data;
  },

  exportQualityReport: async (): Promise<Blob> => {
    const response = await axios.get('/analytics/export-quality-report', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default analyticsService;