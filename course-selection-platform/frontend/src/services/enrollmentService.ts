import axios from '../utils/axios';

interface EnrollmentFilters {
  student?: string;
  course?: string;
  semester?: string;
  status?: string;
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

const enrollmentService = {
  getEnrollments: async (filters?: EnrollmentFilters) => {
    const response = await axios.get('/enrollments', { params: filters });
    return response.data;
  },

  getEnrollmentById: async (id: string) => {
    const response = await axios.get(`/enrollments/${id}`);
    return response.data;
  },

  submitPreferences: async (semester: string, preferences: CoursePreference[]) => {
    const response = await axios.post('/enrollments/preferences', {
      semester,
      preferences,
    });
    return response.data;
  },

  updatePreferences: async (semester: string, preferences: CoursePreference[]) => {
    const response = await axios.put('/enrollments/preferences', {
      semester,
      preferences,
    });
    return response.data;
  },

  runMatchingAlgorithm: async (options: MatchingOptions) => {
    const response = await axios.post('/enrollments/match', options);
    return response.data;
  },

  confirmEnrollment: async (id: string) => {
    const response = await axios.post(`/enrollments/${id}/confirm`);
    return response.data;
  },

  dropCourse: async (id: string, reason?: string) => {
    const response = await axios.post(`/enrollments/${id}/drop`, { reason });
    return response.data;
  },

  professorReview: async (id: string, approved: boolean, comment?: string) => {
    const response = await axios.post(`/enrollments/${id}/professor-review`, {
      approved,
      comment,
    });
    return response.data;
  },

  getEnrollmentStatistics: async (semester: string) => {
    const response = await axios.get(`/enrollments/statistics/${semester}`);
    return response.data;
  },

  exportEnrollmentData: async (semester: string, format?: string) => {
    const response = await axios.get(`/enrollments/export/${semester}`, {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },

  getCourseWaitlist: async (courseId: string) => {
    const response = await axios.get(`/enrollments/course/${courseId}/waitlist`);
    return response.data;
  },

  processWaitlist: async (courseId: string, count?: number) => {
    const response = await axios.post(`/enrollments/course/${courseId}/process-waitlist`, {
      count,
    });
    return response.data;
  },

  getMyEnrollments: async () => {
    const response = await axios.get('/enrollments', {
      params: { student: 'me' },
    });
    return response.data;
  },

  getPendingReviews: async () => {
    const response = await axios.get('/enrollments', {
      params: { needsReview: true },
    });
    return response.data;
  },

  reviewApplication: async (enrollmentId: string, approved: boolean, comment: string) => {
    const response = await axios.post(`/enrollments/${enrollmentId}/professor-review`, {
      approved,
      comment,
    });
    return response.data;
  },
};

export default enrollmentService;