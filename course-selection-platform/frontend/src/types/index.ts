// Core entity types
export interface User {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: 'leader' | 'secretary' | 'professor' | 'student';
  nameCn: string;
  nameEn: string;
  department: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  _id: string;
  courseId: string;
  nameCn: string;
  nameEn: string;
  descriptionCn: string;
  descriptionEn: string;
  credits: number;
  capacity: number;
  semester: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived';
  professor: User | string;
  schedule: CourseSchedule[];
  prerequisites?: string[];
  tags?: string[];
  materials?: CourseMaterial[];
  assessments?: CourseAssessment[];
  enrollmentCount: number;
  enrolled: number; // Current enrollment count
  createdAt: string;
  updatedAt: string;
}

export interface CourseSchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  location: string;
  recurrence?: 'weekly' | 'biweekly' | 'monthly';
}

export interface CourseMaterial {
  _id: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'assignment';
  url?: string;
  description?: string;
  isRequired: boolean;
  uploadedAt: string;
}

export interface CourseAssessment {
  _id: string;
  title: string;
  type: 'quiz' | 'exam' | 'assignment' | 'project';
  weight: number; // percentage of final grade
  dueDate?: string;
  description?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  type: 'read' | 'action' | 'approval';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sender: User | string;
  receivers: (User | string)[];
  deadline?: string;
  relatedCourse?: Course | string;
  attachments?: TaskAttachment[];
  responses?: TaskResponse[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface TaskResponse {
  _id: string;
  task: string;
  user: User | string;
  status: 'read' | 'completed' | 'rejected';
  message?: string;
  attachments?: TaskAttachment[];
  respondedAt: string;
}

export interface Enrollment {
  _id: string;
  student: User | string;
  course: Course | string;
  status: 'pending' | 'enrolled' | 'waitlisted' | 'dropped' | 'completed';
  enrolledAt: string;
  priority?: number;
  grade?: string;
  completedAt?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

// Authentication types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Filter types
export interface CourseFilters {
  status?: string;
  semester?: string;
  professor?: string;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskFilters {
  type?: 'read' | 'action' | 'approval';
  status?: string;
  priority?: string;
  role?: 'sender' | 'receiver';
  page?: number;
  limit?: number;
}

export interface UserFilters {
  role?: string;
  department?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Form data types
export interface CourseFormData {
  courseId: string;
  nameCn: string;
  nameEn: string;
  descriptionCn: string;
  descriptionEn: string;
  credits: number;
  capacity: number;
  semester: string;
  schedule: CourseSchedule[];
  prerequisites?: string[];
  tags?: string[];
  materials?: CourseMaterial[];
  assessments?: CourseAssessment[];
}

export interface TaskFormData {
  title: string;
  description: string;
  type: 'read' | 'action' | 'approval';
  receivers: string[];
  deadline?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedCourse?: string;
  metadata?: Record<string, any>;
}

// Statistics and Analytics types
export interface DashboardStats {
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

export interface CourseStatistics {
  enrollmentCount: number;
  completionRate: number;
  averageGrade: number;
  pendingTasks: number;
  studentFeedback: number;
  totalApplications: number;
  enrollmentRate: number;
  dropRate: number;
}

export interface TaskStatistics {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

// Socket.io types
export interface SocketEventData {
  type: string;
  data: any;
  timestamp: string;
}

export interface NotificationData {
  _id: string;
  type: 'task' | 'course' | 'system' | 'reminder';
  title: string;
  message: string;
  recipient: string;
  isRead: boolean;
  relatedEntity?: {
    type: 'course' | 'task' | 'user';
    id: string;
  };
  createdAt: string;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Theme and styling types
export interface ThemeMode {
  mode: 'light' | 'dark';
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;