import axios from '../utils/axios';

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

const analyticsService = {
  getDashboardStats: async () => {
    const response = await axios.get('/analytics/dashboard');
    return response.data;
  },

  getCourseAnalytics: async (filters?: AnalyticsFilters) => {
    const response = await axios.get('/analytics/courses', { params: filters });
    return response.data;
  },

  getEnrollmentAnalytics: async (filters?: AnalyticsFilters) => {
    const response = await axios.get('/analytics/enrollments', { params: filters });
    return response.data;
  },

  getUserActivityAnalytics: async (startDate?: string, endDate?: string) => {
    const response = await axios.get('/analytics/users/activity', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getTaskCompletionAnalytics: async (filters?: AnalyticsFilters) => {
    const response = await axios.get('/analytics/tasks/completion', { params: filters });
    return response.data;
  },

  getProfessorPerformance: async (semester?: string) => {
    const response = await axios.get('/analytics/professors/performance', {
      params: { semester },
    });
    return response.data;
  },

  getStudentSuccessMetrics: async (filters?: AnalyticsFilters) => {
    const response = await axios.get('/analytics/students/success', { params: filters });
    return response.data;
  },

  getCourseRecommendations: async () => {
    const response = await axios.get('/analytics/recommendations');
    return response.data;
  },

  generateAnnualReport: async (year: number) => {
    const response = await axios.get(`/analytics/annual-report/${year}`);
    return response.data;
  },

  getRealtimeStats: async () => {
    const response = await axios.get('/analytics/realtime');
    return response.data;
  },

  exportAnalytics: async (type: string, format?: string, filters?: AnalyticsFilters) => {
    const response = await axios.get('/analytics/export', {
      params: { type, format, ...filters },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },

  getPredictiveAnalytics: async (options: PredictiveOptions) => {
    const response = await axios.get('/analytics/predictions', { params: options });
    return response.data;
  },

  getAnnualMetrics: async (year: number) => {
    const response = await axios.get(`/analytics/annual-metrics/${year}`);
    return response.data;
  },

  getDepartmentComparison: async () => {
    const response = await axios.get('/analytics/department-comparison');
    return response.data;
  },

  getCourseQualityMetrics: async () => {
    const response = await axios.get('/analytics/course-quality');
    return response.data;
  },

  getUnassignedStudents: async () => {
    const response = await axios.get('/analytics/unassigned-students');
    return response.data;
  },

  exportQualityReport: async () => {
    const response = await axios.get('/analytics/export-quality-report', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default analyticsService;