import { ReactNode } from 'react';
import { User, Course, Task, Enrollment } from './index';

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

// Auth context types
export interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  register: (userData: RegisterUserData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface RegisterUserData {
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

// Socket context types
export interface SocketContextProps {
  socket: any; // Socket.IO client type
  isConnected: boolean;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  emit: (event: string, data: any) => void;
  notifications: NotificationData[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
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

// Dashboard component props
export interface DashboardProps extends BaseComponentProps {
  userRole: User['role'];
  stats?: DashboardStats;
}

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  pendingTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
}

// Course component props
export interface CourseCardProps extends BaseComponentProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
  onDelete?: (courseId: string) => void;
  onView?: (courseId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export interface CourseListProps extends BaseComponentProps {
  courses: Course[];
  loading?: boolean;
  onCourseSelect?: (course: Course) => void;
  onCreateNew?: () => void;
  filters?: CourseFilters;
  onFiltersChange?: (filters: CourseFilters) => void;
}

export interface CourseFormProps extends BaseComponentProps {
  course?: Course;
  onSubmit: (data: CourseFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

// Task component props
export interface TaskListItemProps extends BaseComponentProps {
  task: Task;
  onMarkAsRead?: (taskId: string) => void;
  onRespond?: (taskId: string, response: TaskResponseData) => void;
  onDelete?: (taskId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

export interface TaskFormProps extends BaseComponentProps {
  task?: Task;
  onSubmit: (data: TaskFormData, attachments?: File[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

export interface TaskResponseData {
  status: 'read' | 'completed' | 'rejected';
  message?: string;
}

// Table component props
export interface DataTableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationProps;
  onRowClick?: (record: T, index: number) => void;
  rowKey?: keyof T | string;
  emptyMessage?: string;
  showHeader?: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  dataIndex?: keyof T | string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T, index: number) => ReactNode;
  sorter?: (a: T, b: T) => number;
  filters?: Array<{ text: string; value: any }>;
  onFilter?: (value: any, record: T) => boolean;
}

export interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => ReactNode;
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
}

// Form component props
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  name: string;
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
}

export interface SelectFieldProps extends FormFieldProps {
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FileUploadProps extends BaseComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFileChange: (files: File[]) => void;
  onError?: (error: string) => void;
  files?: File[];
  disabled?: boolean;
  showPreview?: boolean;
}

// Modal and dialog props
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  maskClosable?: boolean;
  footer?: ReactNode;
  loading?: boolean;
}

export interface ConfirmDialogProps extends BaseComponentProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
}

// Layout component props
export interface LayoutProps extends BaseComponentProps {
  user?: User;
  onLogout?: () => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export interface SidebarProps extends BaseComponentProps {
  user?: User;
  collapsed?: boolean;
  onToggle?: () => void;
  activeMenuItem?: string;
  onMenuItemClick?: (key: string) => void;
}

export interface HeaderProps extends BaseComponentProps {
  user?: User;
  title?: string;
  onLogout?: () => void;
  onProfileClick?: () => void;
  notifications?: NotificationData[];
  onNotificationClick?: (notification: NotificationData) => void;
}

// Statistics and chart props
export interface StatCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    type: 'up' | 'down' | 'neutral';
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

export interface ChartProps extends BaseComponentProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  xAxisKey?: string;
  yAxisKey?: string;
  title?: string;
  height?: number;
  loading?: boolean;
  colors?: string[];
}

// Filter and search props
export interface SearchProps extends BaseComponentProps {
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  clearable?: boolean;
  debounceMs?: number;
}

export interface FilterPanelProps extends BaseComponentProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onReset?: () => void;
  onApply?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

// Navigation and routing props
export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface PrivateRouteProps {
  children: ReactNode;
  requiredRole?: User['role'] | User['role'][];
  fallback?: ReactNode;
}

// Error boundary props
export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

// Loading and skeleton props
export interface LoadingProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

export interface SkeletonProps extends BaseComponentProps {
  lines?: number;
  width?: string | number;
  height?: string | number;
  circular?: boolean;
  animated?: boolean;
}

// Shared form types
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

export interface CourseSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  recurrence?: 'weekly' | 'biweekly' | 'monthly';
}