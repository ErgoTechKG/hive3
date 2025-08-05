# Course Selection System - API Specification

## 1. API Overview

### Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://courses.hust.edu.cn/api/v1`

### Authentication
All API endpoints (except `/auth/login`) require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
All responses follow this standard format:
```json
{
  "success": true,
  "data": {}, // or []
  "message": "Success message",
  "meta": {
    "timestamp": "2025-08-05T02:31:00.000Z",
    "version": "1.0.0",
    "language": "zh" // or "en"
  },
  "pagination": { // for paginated responses
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-08-05T02:31:00.000Z",
    "requestId": "req_1234567890"
  }
}
```

## 2. Authentication Endpoints

### POST /auth/login
Login with username/email and password.

**Request Body:**
```json
{
  "username": "student001", // or email
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "username": "student001",
      "role": "student",
      "profile": {
        "display_name_zh": "张三",
        "display_name_en": "Zhang San",
        "department": "机械工程学院"
      }
    }
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout
Logout and invalidate tokens.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "student001",
    "email": "student001@hust.edu.cn",
    "role": "student",
    "profile": {
      "avatar_url": "https://cdn.example.com/avatar.jpg",
      "display_name_zh": "张三",
      "display_name_en": "Zhang San",
      "department": "机械工程学院",
      "research_interests": ["机器学习", "机械设计"],
      "skills": ["Python", "MATLAB", "SolidWorks"],
      "contact_info": {
        "phone": "138****1234",
        "wechat": "zhang_san_123"
      },
      "privacy_settings": {
        "phone_visible": false,
        "email_visible": true
      }
    },
    "permissions": ["course:view", "enrollment:create_own", "team:join"]
  }
}
```

## 3. User Management Endpoints

### GET /users
Get list of users (admin/secretary only).

**Query Parameters:**
- `role`: Filter by role (leader, secretary, professor, student)
- `department`: Filter by department
- `search`: Search by name or username
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "prof001",
      "role": "professor",
      "profile": {
        "display_name_zh": "李教授",
        "department": "机械工程学院",
        "avatar_url": "https://cdn.example.com/prof_avatar.jpg"
      },
      "is_active": true,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET /users/:id
Get user details by ID.

### PUT /users/:id
Update user information (own profile or admin).

**Request Body:**
```json
{
  "profile": {
    "display_name_zh": "张三三",
    "research_interests": ["深度学习", "计算机视觉"],
    "contact_info": {
      "phone": "138****5678"
    }
  }
}
```

## 4. Course Management Endpoints

### GET /courses
Get list of courses with filtering and pagination.

**Query Parameters:**
- `academic_year`: Filter by academic year (e.g., "2024-2025")
- `semester`: Filter by semester (spring, fall, summer)
- `category`: Filter by category (required, elective, research, lab)
- `professor_id`: Filter by professor
- `status`: Filter by status (draft, pending_approval, approved, published, closed)
- `search`: Search in course title and description
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "course_code": "ME001",
      "title_zh": "机械设计基础",
      "title_en": "Fundamentals of Mechanical Design",
      "description_zh": "本课程介绍机械设计的基本原理...",
      "professor": {
        "id": "uuid",
        "username": "prof001",
        "profile": {
          "display_name_zh": "李教授"
        }
      },
      "capacity": 50,
      "enrolled_count": 35,
      "credits": 3,
      "category": "required",
      "status": "published",
      "academic_year": "2024-2025",
      "semester": "fall",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /courses
Create new course (professor/secretary/leader only).

**Request Body:**
```json
{
  "course_code": "ME002",
  "title_zh": "高等机械设计",
  "title_en": "Advanced Mechanical Design",
  "description_zh": "深入学习机械设计高级理论...",
  "description_en": "Advanced theoretical study of mechanical design...",
  "capacity": 30,
  "credits": 4,
  "category": "elective",
  "academic_year": "2024-2025",
  "semester": "spring"
}
```

### GET /courses/:id
Get detailed course information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "course_code": "ME001",
    "title_zh": "机械设计基础",
    "title_en": "Fundamentals of Mechanical Design",
    "description_zh": "本课程介绍机械设计的基本原理...",
    "description_en": "This course introduces fundamental principles...",
    "professor": {
      "id": "uuid",
      "username": "prof001",
      "profile": {
        "display_name_zh": "李教授",
        "display_name_en": "Prof. Li",
        "research_interests": ["机械设计", "优化算法"]
      }
    },
    "capacity": 50,
    "enrolled_count": 35,
    "waiting_count": 5,
    "credits": 3,
    "category": "required",
    "status": "published",
    "academic_year": "2024-2025",
    "semester": "fall",
    "sessions": [
      {
        "id": "uuid",
        "session_number": 1,
        "title_zh": "课程介绍",
        "title_en": "Course Introduction",
        "content_zh": "介绍课程目标和要求...",
        "session_date": "2025-03-01",
        "duration": 90,
        "location": "A101教室"
      }
    ],
    "enrollments_summary": {
      "total_applications": 40,
      "approved": 35,
      "pending": 3,
      "rejected": 2
    }
  }
}
```

### PUT /courses/:id
Update course information (course owner/secretary/leader only).

### DELETE /courses/:id
Delete course (course owner/leader only).

### GET /courses/:id/sessions
Get course sessions/schedule.

### POST /courses/:id/sessions
Create course session (professor only).

### GET /courses/:id/enrollments
Get course enrollment list (professor/secretary/leader only).

## 5. Enrollment Management Endpoints

### GET /enrollments
Get user's enrollments or all enrollments (based on role).

**Query Parameters:**
- `student_id`: Filter by student (secretary/leader/professor only)
- `course_id`: Filter by course
- `status`: Filter by status (pending, approved, rejected, enrolled, dropped)
- `academic_year`: Filter by academic year
- `semester`: Filter by semester

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "course": {
        "id": "uuid",
        "course_code": "ME001",
        "title_zh": "机械设计基础",
        "professor": {
          "profile": {
            "display_name_zh": "李教授"
          }
        },
        "capacity": 50,
        "enrolled_count": 35
      },
      "student": {
        "id": "uuid",
        "username": "student001",
        "profile": {
          "display_name_zh": "张三"
        }
      },
      "priority": 1,
      "status": "approved",
      "enrolled_at": "2025-02-01T10:00:00.000Z",
      "approved_at": "2025-02-05T15:30:00.000Z"
    }
  ]
}
```

### POST /enrollments
Submit course enrollment application.

**Request Body:**
```json
{
  "course_id": "uuid",
  "priority": 1, // 1st choice, 2nd choice, etc.
  "motivation": "我对机械设计非常感兴趣..." // optional
}
```

### PUT /enrollments/:id
Update enrollment (change priority, withdraw application).

**Request Body:**
```json
{
  "priority": 2,
  "status": "withdrawn" // student can withdraw
}
```

### DELETE /enrollments/:id
Delete enrollment application (before approval).

### POST /enrollments/:id/approve
Approve enrollment (professor only).

**Request Body:**
```json
{
  "approved": true,
  "comments": "学生背景符合要求"
}
```

## 6. Task Management Endpoints

### GET /tasks
Get tasks for current user.

**Query Parameters:**
- `type`: Filter by type (read, action, approval)
- `status`: Filter by status (pending, read, in_progress, completed, overdue)
- `sender_id`: Filter by sender
- `related_course_id`: Filter by related course
- `deadline_before`: Filter tasks due before date
- `deadline_after`: Filter tasks due after date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "task_id": "T-2025-0001",
      "title": "上传实验课大纲",
      "description": "请在8月25日前上传ME001课程的实验课大纲，包含课次表和阅读资料。",
      "task_type": "action",
      "sender": {
        "id": "uuid",
        "profile": {
          "display_name_zh": "科研秘书"
        }
      },
      "related_course": {
        "id": "uuid",
        "course_code": "ME001",
        "title_zh": "机械设计基础"
      },
      "deadline": "2025-08-25T23:59:59.000Z",
      "status": "pending",
      "created_at": "2025-08-01T09:00:00.000Z",
      "priority": "high"
    }
  ]
}
```

### POST /tasks
Create new task (leader/secretary only).

**Request Body:**
```json
{
  "title": "审批新课程申请",
  "description": "请审批《高等机械设计》课程申请，详见附件。",
  "task_type": "approval",
  "receiver_ids": ["uuid1", "uuid2"],
  "deadline": "2025-08-30T23:59:59.000Z",
  "related_course_id": "uuid",
  "attachments": [
    {
      "name": "课程申请表.pdf",
      "url": "https://storage.example.com/files/application.pdf"
    }
  ]
}
```

### GET /tasks/:id
Get task details.

### PUT /tasks/:id
Update task (sender only).

### DELETE /tasks/:id
Delete task (sender only, if not started).

### POST /tasks/:id/complete
Mark task as completed.

**Request Body (for action/approval tasks):**
```json
{
  "completion_data": {
    "result": "approved", // for approval tasks
    "comments": "课程设置合理，同意开设",
    "attachments": [
      {
        "name": "审批意见.pdf",
        "url": "https://storage.example.com/files/approval.pdf"
      }
    ]
  }
}
```

## 7. Team Management Endpoints

### GET /teams
Get teams (by course or all accessible teams).

**Query Parameters:**
- `course_id`: Filter by course
- `status`: Filter by status (open, full, closed, disbanded)
- `leader_id`: Filter by team leader

### POST /teams
Create new team.

**Request Body:**
```json
{
  "name": "机械设计创新团队",
  "course_id": "uuid",
  "max_members": 6,
  "description": "专注于机械设计创新和实践项目",
  "requirements": "需要有MATLAB或SolidWorks经验"
}
```

### GET /teams/:id
Get team details including members.

### PUT /teams/:id
Update team information (leader only).

### POST /teams/:id/join
Join team.

**Request Body:**
```json
{
  "message": "我有丰富的机械设计经验，希望加入团队"
}
```

### DELETE /teams/:id/leave
Leave team.

### POST /teams/:id/invite
Invite user to team (team leader only).

### PUT /teams/:id/members/:userId
Update member role or remove member (team leader only).

## 8. Notification Endpoints

### GET /notifications
Get user notifications.

**Query Parameters:**
- `type`: Filter by type (task, enrollment, team, system, social)
- `is_read`: Filter by read status
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "task",
      "title": "新任务分配",
      "content": "您有一个新的任务需要完成：上传实验课大纲",
      "metadata": {
        "task_id": "uuid",
        "deadline": "2025-08-25T23:59:59.000Z"
      },
      "is_read": false,
      "created_at": "2025-08-01T09:00:00.000Z"
    },
    {
      "id": "uuid",
      "type": "enrollment",
      "title": "选课结果通知",
      "content": "您的选课申请已被批准：机械设计基础",
      "metadata": {
        "course_id": "uuid",
        "enrollment_id": "uuid"
      },
      "is_read": true,
      "created_at": "2025-07-15T14:30:00.000Z"
    }
  ],
  "meta": {
    "unread_count": 5
  }
}
```

### PUT /notifications/:id/read
Mark notification as read.

### DELETE /notifications/:id
Delete notification.

### PUT /notifications/read-all
Mark all notifications as read.

## 9. Analytics and Dashboard Endpoints

### GET /dashboard/:role
Get role-specific dashboard data.

**Roles:** leader, secretary, professor, student

**Response for student:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "enrolled_courses": 4,
      "pending_applications": 2,
      "pending_tasks": 1,
      "team_memberships": 2
    },
    "cards": [
      {
        "type": "course_enrollment",
        "title": "我的志愿",
        "data": {
          "applications": [
            {
              "course": {
                "title_zh": "机械设计基础",
                "course_code": "ME001"
              },
              "priority": 1,
              "status": "approved",
              "success_probability": 0.95
            }
          ]
        }
      },
      {
        "type": "pending_tasks",
        "title": "待办任务",
        "data": {
          "tasks": [
            {
              "title": "完成选课反馈问卷",
              "deadline": "2025-09-15T23:59:59.000Z",
              "priority": "medium"
            }
          ]
        }
      }
    ],
    "calendar": [
      {
        "date": "2025-09-15",
        "events": [
          {
            "type": "deadline",
            "title": "志愿填报截止",
            "time": "23:59"
          }
        ]
      }
    ]
  }
}
```

### GET /reports/enrollment
Get enrollment analytics (secretary/leader only).

**Query Parameters:**
- `academic_year`: Academic year
- `semester`: Semester
- `course_id`: Specific course

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_courses": 45,
      "total_applications": 2340,
      "total_enrollments": 1890,
      "average_utilization": 0.85
    },
    "by_category": [
      {
        "category": "required",
        "courses": 20,
        "utilization": 0.95
      }
    ],
    "trends": [
      {
        "date": "2025-02-01",
        "applications": 120,
        "enrollments": 98
      }
    ],
    "top_courses": [
      {
        "course": {
          "title_zh": "机械设计基础",
          "course_code": "ME001"
        },
        "applications": 89,
        "capacity": 50,
        "utilization": 1.78
      }
    ]
  }
}
```

### GET /reports/annual
Generate annual report (leader only).

### GET /reports/curriculum-map
Get curriculum mapping analysis (leader only).

## 10. File Upload Endpoints

### POST /upload/avatar
Upload user avatar.

**Request:** Multipart form data with `avatar` file field.

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/avatars/uuid.jpg",
    "size": 245760,
    "mime_type": "image/jpeg"
  }
}
```

### POST /upload/document
Upload document (for tasks, course materials).

**Request:** Multipart form data with `document` file field.

### GET /files/:id
Download file by ID (with access control).

## 11. Real-time WebSocket Events

### Connection
Connect to Socket.io namespaces:
- `/notifications` - Real-time notifications
- `/tasks` - Task updates
- `/courses` - Course and enrollment updates

### Client Events (Sent to Server)
```javascript
// Join user-specific room
socket.emit('join_user_room', { userId: 'uuid' });

// Join course-specific room
socket.emit('join_course_room', { courseId: 'uuid' });

// Update user presence
socket.emit('user_activity', { activity: 'online' });
```

### Server Events (Sent to Client)
```javascript
// New notification
socket.on('notification_new', (notification) => {
  // Handle new notification
});

// Task update
socket.on('task_updated', (task) => {
  // Handle task status change
});

// Course enrollment status change
socket.on('enrollment_status_changed', (enrollment) => {
  // Handle enrollment approval/rejection
});

// Real-time course capacity update
socket.on('course_capacity_updated', (course) => {
  // Update course capacity display
});

// System announcement
socket.on('system_announcement', (announcement) => {
  // Display system-wide announcement
});
```

## 12. Error Codes

### Authentication Errors (40x)
- `AUTH_TOKEN_MISSING` (401) - No authorization token provided
- `AUTH_TOKEN_INVALID` (401) - Invalid or expired token
- `AUTH_TOKEN_EXPIRED` (401) - Token has expired
- `AUTH_INSUFFICIENT_PERMISSIONS` (403) - User lacks required permissions
- `AUTH_ACCOUNT_DISABLED` (403) - User account is disabled

### Validation Errors (400)
- `VALIDATION_ERROR` (400) - Request validation failed
- `INVALID_COURSE_CODE` (400) - Course code format invalid
- `INVALID_DATE_RANGE` (400) - Invalid date range provided
- `DUPLICATE_ENROLLMENT` (400) - Student already enrolled in course

### Resource Errors (404, 409)
- `RESOURCE_NOT_FOUND` (404) - Requested resource not found
- `COURSE_NOT_FOUND` (404) - Course not found
- `USER_NOT_FOUND` (404) - User not found
- `COURSE_CAPACITY_EXCEEDED` (409) - Course is at full capacity
- `ENROLLMENT_DEADLINE_PASSED` (409) - Enrollment deadline has passed

### Server Errors (50x)
- `INTERNAL_SERVER_ERROR` (500) - Unexpected server error
- `DATABASE_CONNECTION_ERROR` (503) - Database connection failed
- `EXTERNAL_SERVICE_ERROR` (503) - External service unavailable

## 13. Rate Limiting

API endpoints are rate-limited based on user role and endpoint type:

- **Authentication endpoints**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **File upload**: 10 requests per minute per user
- **Analytics endpoints**: 20 requests per minute per user

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1628097600
```

## 14. Versioning

The API uses URL versioning (`/api/v1/`). Breaking changes will require a new version.

### Version Support Policy
- Current version (`v1`): Full support
- Previous version: Security updates only for 12 months
- Deprecated versions: 6-month sunset period

## 15. Testing

### API Testing Tools
```bash
# Health check
curl -GET https://courses.hust.edu.cn/api/v1/health

# Login
curl -X POST https://courses.hust.edu.cn/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student001","password":"password123"}'

# Get courses with authentication
curl -X GET https://courses.hust.edu.cn/api/v1/courses \
  -H "Authorization: Bearer <token>" \
  -H "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8"
```

This comprehensive API specification provides clear documentation for all system endpoints, supporting the full course selection system functionality with proper authentication, error handling, and real-time features.