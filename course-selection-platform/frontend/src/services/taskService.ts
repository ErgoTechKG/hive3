import axios from '../utils/axios';

interface TaskFilters {
  type?: 'read' | 'action' | 'approval';
  status?: string;
  priority?: string;
  role?: 'sender' | 'receiver';
  page?: number;
  limit?: number;
}

interface CreateTaskData {
  title: string;
  description: string;
  type: 'read' | 'action' | 'approval';
  receivers: string[];
  deadline?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedCourse?: string;
  metadata?: any;
}

interface TaskResponse {
  status: 'read' | 'completed' | 'rejected';
  message?: string;
}

const taskService = {
  getTasks: async (filters?: TaskFilters) => {
    const response = await axios.get('/tasks', { params: filters });
    return response.data;
  },

  getTaskById: async (id: string) => {
    const response = await axios.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: CreateTaskData, attachments?: File[]) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'receivers' && Array.isArray(value)) {
          value.forEach(receiver => formData.append('receivers[]', receiver));
        } else {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
      }
    });

    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }

    const response = await axios.post('/tasks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateTaskResponse: async (id: string, response: TaskResponse, attachments?: File[]) => {
    const formData = new FormData();
    formData.append('status', response.status);
    if (response.message) {
      formData.append('message', response.message);
    }

    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }

    const result = await axios.put(`/tasks/${id}/response`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return result.data;
  },

  markAsRead: async (id: string) => {
    const response = await axios.post(`/tasks/${id}/read`);
    return response.data;
  },

  sendReminder: async (id: string, level?: 'gentle' | 'normal' | 'urgent') => {
    const response = await axios.post(`/tasks/${id}/remind`, { level });
    return response.data;
  },

  getTaskStatistics: async () => {
    const response = await axios.get('/tasks/statistics/overview');
    return response.data;
  },

  getOverdueTasks: async () => {
    const response = await axios.get('/tasks/overdue/list');
    return response.data;
  },

  batchCreateTasks: async (tasks: CreateTaskData[]) => {
    const response = await axios.post('/tasks/batch/create', { tasks });
    return response.data;
  },

  getTaskTemplates: async () => {
    const response = await axios.get('/tasks/templates/list');
    return response.data;
  },

  archiveCompletedTasks: async (beforeDate: string) => {
    const response = await axios.post('/tasks/archive/completed', { beforeDate });
    return response.data;
  },

  getMyTasks: async (filters?: { status?: string }) => {
    const response = await axios.get('/tasks', {
      params: { ...filters, role: 'receiver' },
    });
    return response.data;
  },
};

export default taskService;