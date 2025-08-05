const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  APP_NAME: '选课系统',
  APP_NAME_EN: 'Course Selection System',
  UNIVERSITY: '华中科技大学机械学院',
  UNIVERSITY_EN: 'School of Mechanical Science & Engineering, HUST',
  
  // Feature flags
  FEATURES: {
    SOCIAL_NETWORK: process.env.REACT_APP_FEATURE_SOCIAL_NETWORK === 'true',
    ANALYTICS: process.env.REACT_APP_FEATURE_ANALYTICS === 'true',
    EXPORT: process.env.REACT_APP_FEATURE_EXPORT === 'true',
  },
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  
  // File upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  
  // Date format
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm',
  
  // Semester format
  CURRENT_SEMESTER: '2025-Spring',
  SEMESTERS: [
    '2025-Spring',
    '2024-Fall',
    '2024-Spring',
    '2023-Fall',
  ],
  
  // Course enrollment
  MAX_PREFERENCES: 5,
  MIN_PREFERENCES: 1,
  
  // Task priorities
  TASK_PRIORITIES: [
    { value: 'low', label: '低', color: 'info' },
    { value: 'medium', label: '中', color: 'warning' },
    { value: 'high', label: '高', color: 'error' },
    { value: 'urgent', label: '紧急', color: 'error' },
  ],
  
  // Role configurations
  ROLES: {
    leader: {
      label: '领导',
      labelEn: 'Leader',
      color: 'error',
      icon: 'AdminPanelSettings',
    },
    secretary: {
      label: '科研秘书',
      labelEn: 'Secretary',
      color: 'warning',
      icon: 'Assignment',
    },
    professor: {
      label: '授课教授',
      labelEn: 'Professor',
      color: 'primary',
      icon: 'School',
    },
    student: {
      label: '学生',
      labelEn: 'Student',
      color: 'success',
      icon: 'Person',
    },
  },
};

export default config;