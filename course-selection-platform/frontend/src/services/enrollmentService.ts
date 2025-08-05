import axios from '../utils/axios';
import { ApiResponse, PaginatedResponse, Enrollment } from '../types';

interface EnrollmentFilters {
  student?: string;
  course?: string;
  semester?: string;
  status?: 'pending' | 'enrolled' | 'waitlisted' | 'dropped' | 'completed';
  page?: number;
  limit?: number;
}

interface CoursePreference {
  courseId: string;
  rank: number;
  reason?: string;
}

interface MatchingOptions {
  semester: string;
  algorithm?: 'priority' | 'lottery' | 'hybrid';
}

interface EnrollmentStatistics {
  totalEnrollments: number;
  enrollmentsByStatus: Record<string, number>;
  waitlistLength: number;
  dropoutRate: number;
  popularityScore: number;
  totalStudents: number;
  submittedPreferences: number;
  pendingSubmissions: number;
  matchingRate: number;
}

interface MatchingResult {
  matched: number;
  waitlisted: number;
  unmatched: number;
  details: Array<{ studentId: string; courseId: string; status: string }>;
}

const enrollmentService = {
  getEnrollments: async (filters?: EnrollmentFilters): Promise<PaginatedResponse<Enrollment>> => {
    const response = await axios.get<PaginatedResponse<Enrollment>>('/enrollments', { params: filters });
    return response.data;
  },

  getEnrollmentById: async (id: string): Promise<ApiResponse<{ enrollment: Enrollment }>> => {
    const response = await axios.get<ApiResponse<{ enrollment: Enrollment }>>(`/enrollments/${id}`);
    return response.data;
  },

  submitPreferences: async (semester: string, preferences: CoursePreference[]): Promise<ApiResponse<{ preferences: CoursePreference[] }>> => {
    const response = await axios.post<ApiResponse<{ preferences: CoursePreference[] }>>('/enrollments/preferences', {
      semester,
      preferences,
    });
    return response.data;
  },

  updatePreferences: async (semester: string, preferences: CoursePreference[]): Promise<ApiResponse<{ preferences: CoursePreference[] }>> => {
    const response = await axios.put<ApiResponse<{ preferences: CoursePreference[] }>>('/enrollments/preferences', {
      semester,
      preferences,
    });
    return response.data;
  },

  runMatchingAlgorithm: async (options: MatchingOptions): Promise<ApiResponse<MatchingResult>> => {
    const response = await axios.post<ApiResponse<MatchingResult>>('/enrollments/match', options);
    return response.data;
  },

  confirmEnrollment: async (id: string): Promise<ApiResponse<{ enrollment: Enrollment }>> => {
    const response = await axios.post<ApiResponse<{ enrollment: Enrollment }>>(`/enrollments/${id}/confirm`);
    return response.data;
  },

  dropCourse: async (id: string, reason?: string): Promise<ApiResponse<void>> => {
    const response = await axios.post<ApiResponse<void>>(`/enrollments/${id}/drop`, { reason });
    return response.data;
  },

  professorReview: async (id: string, approved: boolean, comment?: string): Promise<ApiResponse<{ enrollment: Enrollment }>> => {
    const response = await axios.post<ApiResponse<{ enrollment: Enrollment }>>(`/enrollments/${id}/professor-review`, {
      approved,
      comment,
    });
    return response.data;
  },

  getEnrollmentStatistics: async (semester: string): Promise<ApiResponse<EnrollmentStatistics>> => {
    const response = await axios.get<ApiResponse<EnrollmentStatistics>>(`/enrollments/statistics/${semester}`);
    return response.data;
  },

  exportEnrollmentData: async (semester: string, format?: string): Promise<Blob | ApiResponse<{ downloadUrl: string }>> => {
    const response = await axios.get(`/enrollments/export/${semester}`, {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },

  getCourseWaitlist: async (courseId: string): Promise<PaginatedResponse<Enrollment>> => {
    const response = await axios.get<PaginatedResponse<Enrollment>>(`/enrollments/course/${courseId}/waitlist`);
    return response.data;
  },

  processWaitlist: async (courseId: string, count?: number): Promise<ApiResponse<{ processed: number; notified: string[] }>> => {
    const response = await axios.post<ApiResponse<{ processed: number; notified: string[] }>>(`/enrollments/course/${courseId}/process-waitlist`, {
      count,
    });
    return response.data;
  },

  getMyEnrollments: async (): Promise<PaginatedResponse<Enrollment>> => {
    const response = await axios.get<PaginatedResponse<Enrollment>>('/enrollments', {
      params: { student: 'me' },
    });
    return response.data;
  },

  getPendingReviews: async (): Promise<PaginatedResponse<Enrollment>> => {
    const response = await axios.get<PaginatedResponse<Enrollment>>('/enrollments', {
      params: { needsReview: true },
    });
    return response.data;
  },

  reviewApplication: async (enrollmentId: string, approved: boolean, comment: string): Promise<ApiResponse<{ enrollment: Enrollment }>> => {
    const response = await axios.post<ApiResponse<{ enrollment: Enrollment }>>(`/enrollments/${enrollmentId}/professor-review`, {
      approved,
      comment,
    });
    return response.data;
  },
};

export default enrollmentService;