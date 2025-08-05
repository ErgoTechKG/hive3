import axios from '../utils/axios';

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

const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await axios.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await axios.post('/auth/logout');
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await axios.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axios.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await axios.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await axios.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await axios.post('/auth/reset-password', { token, password });
    return response.data;
  },
};

export default authService;