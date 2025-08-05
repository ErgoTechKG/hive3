import axios from '../utils/axios';
import { ApiResponse, PaginatedResponse, Course, CourseStatistics } from '../types';

interface CourseFilters {
  status?: string;
  semester?: string;
  professor?: string;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CourseData {
  courseId: string;
  nameCn: string;
  nameEn: string;
  descriptionCn: string;
  descriptionEn: string;
  credits: number;
  capacity: number;
  semester: string;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  prerequisites?: string[];
  tags?: string[];
  materials?: CourseMaterial[];
  assessments?: CourseAssessment[];
}

interface CourseMaterial {
  _id: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'assignment';
  url?: string;
  description?: string;
  isRequired: boolean;
  uploadedAt: string;
}

interface CourseAssessment {
  _id: string;
  title: string;
  type: 'quiz' | 'exam' | 'assignment' | 'project';
  weight: number;
  dueDate?: string;
  description?: string;
}

const courseService = {
  getCourses: async (filters?: CourseFilters): Promise<PaginatedResponse<Course>> => {
    const response = await axios.get<PaginatedResponse<Course>>('/courses', { params: filters });
    return response.data;
  },

  getCourseById: async (id: string): Promise<ApiResponse<{ course: Course }>> => {
    const response = await axios.get<ApiResponse<{ course: Course }>>(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (data: CourseData): Promise<ApiResponse<{ course: Course }>> => {
    const response = await axios.post<ApiResponse<{ course: Course }>>('/courses', data);
    return response.data;
  },

  updateCourse: async (id: string, data: Partial<CourseData>): Promise<ApiResponse<{ course: Course }>> => {
    const response = await axios.put<ApiResponse<{ course: Course }>>(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axios.delete<ApiResponse<void>>(`/courses/${id}`);
    return response.data;
  },

  submitForApproval: async (id: string): Promise<ApiResponse<{ course: Course }>> => {
    const response = await axios.post<ApiResponse<{ course: Course }>>(`/courses/${id}/submit`);
    return response.data;
  },

  approveCourse: async (id: string, approved: boolean, comment?: string): Promise<ApiResponse<{ course: Course }>> => {
    const response = await axios.post<ApiResponse<{ course: Course }>>(`/courses/${id}/approve`, { approved, comment });
    return response.data;
  },

  publishCourse: async (id: string): Promise<ApiResponse<{ course: Course }>> => {
    const response = await axios.post<ApiResponse<{ course: Course }>>(`/courses/${id}/publish`);
    return response.data;
  },

  archiveCourse: async (id: string): Promise<ApiResponse<{ course: Course }>> => {
    const response = await axios.post<ApiResponse<{ course: Course }>>(`/courses/${id}/archive`);
    return response.data;
  },

  getCourseStatistics: async (id: string): Promise<ApiResponse<CourseStatistics>> => {
    const response = await axios.get<ApiResponse<CourseStatistics>>(`/courses/${id}/statistics`);
    return response.data;
  },

  getCoursesByProfessor: async (professorId: string, semester?: string): Promise<PaginatedResponse<Course>> => {
    const response = await axios.get<PaginatedResponse<Course>>(`/courses/professor/${professorId}`, {
      params: { semester },
    });
    return response.data;
  },

  batchPublishCourses: async (courseIds: string[]): Promise<ApiResponse<{ published: string[]; failed: string[] }>> => {
    const response = await axios.post<ApiResponse<{ published: string[]; failed: string[] }>>('/courses/batch/publish', { courseIds });
    return response.data;
  },

  getMyCourses: async (): Promise<PaginatedResponse<Course>> => {
    const response = await axios.get<PaginatedResponse<Course>>('/courses', {
      params: { professor: 'me' },
    });
    return response.data;
  },

  getPendingApprovals: async (): Promise<PaginatedResponse<Course>> => {
    const response = await axios.get<PaginatedResponse<Course>>('/courses', {
      params: { status: 'pending_approval' },
    });
    return response.data;
  },
};

export default courseService;