import axios from '../utils/axios';
import { ApiResponse, PaginatedResponse, Task, TaskStatistics } from '../types';

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
  metadata?: Record<string, any>;
}

interface TaskResponseData {
  status: 'read' | 'completed' | 'rejected';
  message?: string;
}

interface TaskTemplate {
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

const taskService = {
  getTasks: async (filters?: TaskFilters): Promise<PaginatedResponse<Task>> => {
    const response = await axios.get<PaginatedResponse<Task>>('/tasks', { params: filters });
    return response.data;
  },

  getTaskById: async (id: string): Promise<ApiResponse<{ task: Task }>> => {
    const response = await axios.get<ApiResponse<{ task: Task }>>(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: CreateTaskData, attachments?: File[]): Promise<ApiResponse<{ task: Task }>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'receivers' && Array.isArray(value)) {
          value.forEach(receiver => formData.append('receivers[]', receiver));
        } else {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      }
    });

    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }

    const response = await axios.post<ApiResponse<{ task: Task }>>('/tasks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateTaskResponse: async (id: string, responseData: TaskResponseData, attachments?: File[]): Promise<ApiResponse<{ task: Task }>> => {
    const formData = new FormData();
    formData.append('status', responseData.status);
    if (responseData.message) {
      formData.append('message', responseData.message);
    }

    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }

    const response = await axios.put<ApiResponse<{ task: Task }>>(`/tasks/${id}/response`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<{ task: Task }>> => {
    const response = await axios.post<ApiResponse<{ task: Task }>>(`/tasks/${id}/read`);
    return response.data;
  },

  sendReminder: async (id: string, level?: 'gentle' | 'normal' | 'urgent'): Promise<ApiResponse<void>> => {
    const response = await axios.post<ApiResponse<void>>(`/tasks/${id}/remind`, { level });
    return response.data;
  },

  getTaskStatistics: async (): Promise<ApiResponse<TaskStatistics>> => {
    const response = await axios.get<ApiResponse<TaskStatistics>>('/tasks/statistics/overview');
    return response.data;
  },

  getOverdueTasks: async (): Promise<PaginatedResponse<Task>> => {
    const response = await axios.get<PaginatedResponse<Task>>('/tasks/overdue/list');
    return response.data;
  },

  batchCreateTasks: async (tasks: CreateTaskData[]): Promise<ApiResponse<{ created: string[]; failed: string[] }>> => {
    const response = await axios.post<ApiResponse<{ created: string[]; failed: string[] }>>('/tasks/batch/create', { tasks });
    return response.data;
  },

  getTaskTemplates: async (): Promise<ApiResponse<{ templates: TaskTemplate[] }>> => {
    const response = await axios.get<ApiResponse<{ templates: TaskTemplate[] }>>('/tasks/templates/list');
    return response.data;
  },

  archiveCompletedTasks: async (beforeDate: string): Promise<ApiResponse<{ archived: number }>> => {
    const response = await axios.post<ApiResponse<{ archived: number }>>('/tasks/archive/completed', { beforeDate });
    return response.data;
  },

  getMyTasks: async (filters?: { status?: string }): Promise<PaginatedResponse<Task>> => {
    const response = await axios.get<PaginatedResponse<Task>>('/tasks', {
      params: { ...filters, role: 'receiver' },
    });
    return response.data;
  },
};

export default taskService;