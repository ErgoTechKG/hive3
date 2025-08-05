import axios from '../utils/axios';

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
  materials?: any[];
  assessments?: any[];
}

const courseService = {
  getCourses: async (filters?: CourseFilters) => {
    const response = await axios.get('/courses', { params: filters });
    return response.data;
  },

  getCourseById: async (id: string) => {
    const response = await axios.get(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (data: CourseData) => {
    const response = await axios.post('/courses', data);
    return response.data;
  },

  updateCourse: async (id: string, data: Partial<CourseData>) => {
    const response = await axios.put(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id: string) => {
    const response = await axios.delete(`/courses/${id}`);
    return response.data;
  },

  submitForApproval: async (id: string) => {
    const response = await axios.post(`/courses/${id}/submit`);
    return response.data;
  },

  approveCourse: async (id: string, approved: boolean, comment?: string) => {
    const response = await axios.post(`/courses/${id}/approve`, { approved, comment });
    return response.data;
  },

  publishCourse: async (id: string) => {
    const response = await axios.post(`/courses/${id}/publish`);
    return response.data;
  },

  archiveCourse: async (id: string) => {
    const response = await axios.post(`/courses/${id}/archive`);
    return response.data;
  },

  getCourseStatistics: async (id: string) => {
    const response = await axios.get(`/courses/${id}/statistics`);
    return response.data;
  },

  getCoursesByProfessor: async (professorId: string, semester?: string) => {
    const response = await axios.get(`/courses/professor/${professorId}`, {
      params: { semester },
    });
    return response.data;
  },

  batchPublishCourses: async (courseIds: string[]) => {
    const response = await axios.post('/courses/batch/publish', { courseIds });
    return response.data;
  },

  getMyCourses: async () => {
    const response = await axios.get('/courses', {
      params: { professor: 'me' },
    });
    return response.data;
  },

  getPendingApprovals: async () => {
    const response = await axios.get('/courses', {
      params: { status: 'pending_approval' },
    });
    return response.data;
  },
};

export default courseService;