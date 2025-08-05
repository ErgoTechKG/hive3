import axios from '../utils/axios';
import { ApiResponse, AuthResponse, User } from '../types';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
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

interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await axios.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await axios.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const response = await axios.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthTokenResponse>> => {
    const response = await axios.post<ApiResponse<AuthTokenResponse>>('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await axios.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    const response = await axios.put<ApiResponse<void>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    const response = await axios.post<ApiResponse<void>>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<void>> => {
    const response = await axios.post<ApiResponse<void>>('/auth/reset-password', { token, password });
    return response.data;
  },
};

export default authService;