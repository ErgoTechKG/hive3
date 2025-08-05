# Course Selection System - System Architecture

## 1. Architecture Overview

### 1.1 High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Tier   │    │  Application    │    │   Data Tier     │
│                 │    │     Tier        │    │                 │
│ React Frontend  │◄──►│ Node.js/Express │◄──►│ PostgreSQL      │
│ PWA Support     │    │ API Gateway     │    │ Redis Cache     │
│ Socket.io Client│    │ Auth Service    │    │ File Storage    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 Technology Stack Selection

#### Frontend Stack
- **React 18** with TypeScript - Component-based UI with type safety
- **Next.js 14** - Server-side rendering, routing, and optimization
- **Ant Design** - Enterprise-class UI components with i18n support
- **React Query** - Server state management and caching
- **Socket.io Client** - Real-time communication
- **PWA** - Progressive Web App for mobile optimization

#### Backend Stack
- **Node.js 20 LTS** - JavaScript runtime with excellent performance
- **Express.js** - Web framework with middleware ecosystem
- **TypeScript** - Type safety and better developer experience
- **Prisma ORM** - Type-safe database access with migrations
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Stateless authentication
- **bcrypt** - Password hashing
- **helmet** - Security middleware

#### Database & Storage
- **PostgreSQL 15** - Primary relational database (ACID compliance)
- **Redis 7** - Caching and session storage
- **MinIO/AWS S3** - File storage for documents and avatars
- **pgvector** - Vector storage for AI recommendations

#### DevOps & Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local development orchestration
- **Nginx** - Reverse proxy and load balancer
- **PM2** - Process management for Node.js
- **GitHub Actions** - CI/CD pipeline

## 2. Database Schema Design

### 2.1 Core Entities

```sql
-- Users table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL, -- leader, secretary, professor, student
    profile JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    title_zh VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    description_zh TEXT,
    description_en TEXT,
    professor_id UUID REFERENCES users(id),
    capacity INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    category course_category,
    status course_status DEFAULT 'draft',
    academic_year VARCHAR(9) NOT NULL, -- 2024-2025
    semester semester_type NOT NULL, -- spring, fall, summer
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Course sessions/schedules
CREATE TABLE course_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    title_zh VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    content_zh TEXT,
    content_en TEXT,
    resources JSONB, -- reading materials, assignments
    session_date DATE,
    duration INTEGER, -- minutes
    location VARCHAR(255)
);

-- Course enrollments (志愿填报)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    priority INTEGER NOT NULL, -- 1st choice, 2nd choice, etc.
    status enrollment_status DEFAULT 'pending',
    professor_approved BOOLEAN DEFAULT false,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Task and Message System
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(50) UNIQUE NOT NULL, -- T-2025-0001
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type task_type NOT NULL, -- read, action, approval
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    related_course_id UUID REFERENCES courses(id),
    deadline TIMESTAMP,
    status task_status DEFAULT 'pending',
    completion_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Social network and profiles
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    avatar_url VARCHAR(255),
    display_name_zh VARCHAR(100),
    display_name_en VARCHAR(100),
    department VARCHAR(100),
    research_interests JSONB,
    skills JSONB,
    contact_info JSONB,
    privacy_settings JSONB,
    social_visibility privacy_level DEFAULT 'department'
);

-- Follows/Connections for social network
CREATE TABLE user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id),
    following_id UUID REFERENCES users(id),
    connection_type connection_type, -- follow, teammate, mentor
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Teams for group projects
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    course_id UUID REFERENCES courses(id),
    leader_id UUID REFERENCES users(id),
    max_members INTEGER DEFAULT 6,
    description TEXT,
    status team_status DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id),
    student_id UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    role team_role DEFAULT 'member',
    PRIMARY KEY (team_id, student_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Custom Types

```sql
CREATE TYPE user_role AS ENUM ('leader', 'secretary', 'professor', 'student');
CREATE TYPE course_category AS ENUM ('required', 'elective', 'research', 'lab');
CREATE TYPE course_status AS ENUM ('draft', 'pending_approval', 'approved', 'published', 'closed');
CREATE TYPE semester_type AS ENUM ('spring', 'fall', 'summer');
CREATE TYPE enrollment_status AS ENUM ('pending', 'approved', 'rejected', 'enrolled', 'dropped');
CREATE TYPE task_type AS ENUM ('read', 'action', 'approval');
CREATE TYPE task_status AS ENUM ('pending', 'read', 'in_progress', 'completed', 'overdue', 'rejected');
CREATE TYPE privacy_level AS ENUM ('public', 'department', 'course_only', 'private');
CREATE TYPE connection_type AS ENUM ('follow', 'teammate', 'mentor', 'colleague');
CREATE TYPE team_status AS ENUM ('open', 'full', 'closed', 'disbanded');
CREATE TYPE team_role AS ENUM ('leader', 'member', 'advisor');
CREATE TYPE notification_type AS ENUM ('task', 'enrollment', 'team', 'system', 'social');
```

## 3. API Architecture

### 3.1 RESTful API Design

```
/api/v1/
├── auth/
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   └── GET /profile
├── users/
│   ├── GET /users
│   ├── GET /users/:id
│   ├── PUT /users/:id
│   └── GET /users/:id/profile
├── courses/
│   ├── GET /courses
│   ├── POST /courses
│   ├── GET /courses/:id
│   ├── PUT /courses/:id
│   ├── DELETE /courses/:id
│   ├── GET /courses/:id/sessions
│   ├── POST /courses/:id/sessions
│   └── GET /courses/:id/enrollments
├── enrollments/
│   ├── GET /enrollments
│   ├── POST /enrollments
│   ├── PUT /enrollments/:id
│   └── DELETE /enrollments/:id
├── tasks/
│   ├── GET /tasks
│   ├── POST /tasks
│   ├── PUT /tasks/:id
│   ├── DELETE /tasks/:id
│   └── POST /tasks/:id/complete
├── teams/
│   ├── GET /teams
│   ├── POST /teams
│   ├── GET /teams/:id
│   ├── PUT /teams/:id
│   ├── POST /teams/:id/join
│   └── DELETE /teams/:id/leave
├── notifications/
│   ├── GET /notifications
│   ├── PUT /notifications/:id/read
│   └── DELETE /notifications/:id
└── analytics/
    ├── GET /dashboard/:role
    ├── GET /reports/enrollment
    ├── GET /reports/annual
    └── GET /reports/curriculum-map
```

### 3.2 GraphQL Alternative (Optional)

For complex queries involving multiple entities, we can implement GraphQL:

```graphql
type Query {
  courses(filter: CourseFilter, pagination: Pagination): [Course!]!
  userDashboard(role: UserRole!): Dashboard!
  courseAnalytics(courseId: ID!, timeRange: TimeRange): Analytics!
  socialNetwork(userId: ID!, depth: Int): SocialGraph!
}

type Mutation {
  createCourse(input: CreateCourseInput!): Course!
  enrollInCourse(courseId: ID!, priority: Int!): Enrollment!
  createTask(input: CreateTaskInput!): Task!
  completeTask(taskId: ID!, completionData: JSON): Task!
}

type Subscription {
  notificationAdded(userId: ID!): Notification!
  taskUpdated(userId: ID!): Task!
  enrollmentStatusChanged(studentId: ID!): Enrollment!
}
```

## 4. Authentication & Authorization

### 4.1 JWT-Based Authentication

```typescript
interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}

// Token structure
{
  "access_token": "eyJ...", // 15 minutes
  "refresh_token": "eyJ...", // 7 days
  "token_type": "Bearer",
  "expires_in": 900
}
```

### 4.2 Role-Based Access Control (RBAC)

```typescript
const permissions = {
  leader: [
    'course:approve',
    'user:manage',
    'analytics:view_all',
    'task:create_system',
    'report:generate'
  ],
  secretary: [
    'course:manage',
    'enrollment:manage',
    'task:create',
    'notification:send',
    'report:view'
  ],
  professor: [
    'course:create',
    'course:update_own',
    'enrollment:approve',
    'task:create_course',
    'student:view_enrolled'
  ],
  student: [
    'course:view',
    'enrollment:create_own',
    'team:join',
    'profile:update_own',
    'task:complete_assigned'
  ]
};
```

### 4.3 Middleware Stack

```typescript
// Authentication middleware
app.use('/api/v1', authenticateToken);

// Authorization middleware
app.use('/api/v1/admin', authorize(['leader', 'secretary']));
app.use('/api/v1/courses/:id/approve', authorize(['leader']));
app.use('/api/v1/enrollments', authorize(['student', 'secretary']));
```

## 5. Real-time Communication

### 5.1 Socket.io Implementation

```typescript
// Server-side namespaces
io.of('/notifications').on('connection', (socket) => {
  // Join room based on user role and department
  socket.join(`user_${socket.userId}`);
  socket.join(`role_${socket.userRole}`);
  socket.join(`dept_${socket.department}`);
});

io.of('/tasks').on('connection', (socket) => {
  // Real-time task updates
  socket.on('task:update', (taskId) => {
    // Broadcast to task participants
  });
});

io.of('/courses').on('connection', (socket) => {
  // Course enrollment updates
  socket.on('enrollment:status', (courseId) => {
    // Real-time capacity updates
  });
});
```

### 5.2 Real-time Features

1. **Instant Notifications**
   - Task assignments
   - Enrollment status changes
   - Course updates
   - Team invitations

2. **Live Dashboard Updates**
   - Enrollment progress
   - Task completion status
   - System announcements

3. **Collaborative Features**
   - Team formation
   - Real-time chat (future)
   - Document collaboration

## 6. Caching Strategy

### 6.1 Redis Cache Layers

```typescript
// Cache patterns
const cachePatterns = {
  // User sessions (15 minutes)
  user_session: 'session:user:{userId}',
  
  // Course data (1 hour)
  course_list: 'courses:list:{filter_hash}',
  course_detail: 'course:{courseId}',
  
  // Dashboard data (5 minutes)
  dashboard: 'dashboard:{userId}:{role}',
  
  // Analytics (30 minutes)
  analytics: 'analytics:{type}:{timeRange}',
  
  // Social network (1 hour)
  social_graph: 'social:{userId}:{depth}'
};
```

### 6.2 Cache Invalidation

```typescript
// Event-driven cache invalidation
eventEmitter.on('course.updated', (courseId) => {
  redis.del(`course:${courseId}`);
  redis.del('courses:list:*');
});

eventEmitter.on('enrollment.created', (enrollment) => {
  redis.del(`dashboard:${enrollment.studentId}:student`);
  redis.del(`course:${enrollment.courseId}`);
});
```

## 7. Security Architecture

### 7.1 Security Layers

1. **Network Security**
   - HTTPS enforced
   - CORS configuration
   - Rate limiting
   - DDoS protection

2. **Application Security**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CSRF tokens

3. **Data Security**
   - Password hashing (bcrypt)
   - Sensitive data encryption
   - Audit logging
   - Data anonymization

### 7.2 Security Middleware

```typescript
// Security middleware stack
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## 8. Deployment Architecture

### 8.1 Production Deployment

```yaml
# docker-compose.production.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

  frontend:
    build: ./frontend
    environment:
      - NODE_ENV=production
    volumes:
      - /app/node_modules

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 8.2 Microservices Architecture (Future)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  User Service   │    │ Course Service  │
│   (Kong/Nginx)  │◄──►│   (Node.js)     │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Notification    │    │  Task Service   │    │Analytics Service│
│   Service       │    │   (Node.js)     │    │   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 9. Performance Optimization

### 9.1 Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_professor_semester ON courses(professor_id, academic_year, semester);
CREATE INDEX idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX idx_tasks_receiver_status ON tasks(receiver_id, status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- Partial indexes for specific use cases
CREATE INDEX idx_active_courses ON courses(academic_year, semester) 
WHERE status = 'published';

CREATE INDEX idx_pending_tasks ON tasks(receiver_id, deadline) 
WHERE status = 'pending';
```

### 9.2 Application Performance

1. **Database Connection Pooling**
   ```typescript
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

2. **Query Optimization**
   ```typescript
   // Use Prisma's include for efficient joins
   const courseWithEnrollments = await prisma.course.findMany({
     include: {
       enrollments: {
         where: { status: 'approved' },
         include: { student: { select: { id: true, username: true } } }
       },
       professor: { select: { id: true, username: true } }
     }
   });
   ```

3. **Pagination and Filtering**
   ```typescript
   const paginatedCourses = await prisma.course.findMany({
     skip: (page - 1) * limit,
     take: limit,
     where: filters,
     orderBy: { createdAt: 'desc' }
   });
   ```

## 10. Internationalization (i18n)

### 10.1 Backend i18n

```typescript
// Language detection middleware
app.use((req, res, next) => {
  const acceptLanguage = req.headers['accept-language'];
  req.language = acceptLanguage?.includes('zh') ? 'zh' : 'en';
  next();
});

// Response formatting
const formatCourseResponse = (course, language) => ({
  id: course.id,
  title: course[`title_${language}`] || course.title_zh,
  description: course[`description_${language}`] || course.description_zh,
  // ... other fields
});
```

### 10.2 Frontend i18n

```typescript
// React i18next configuration
const resources = {
  en: {
    translation: {
      "dashboard.title": "Dashboard",
      "courses.enrollment": "Course Enrollment",
      "tasks.pending": "Pending Tasks"
    }
  },
  zh: {
    translation: {
      "dashboard.title": "控制台",
      "courses.enrollment": "课程报名",
      "tasks.pending": "待办任务"
    }
  }
};
```

## 11. Monitoring and Analytics

### 11.1 Application Monitoring

```typescript
// Winston logging configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Performance monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent')
    });
  });
  next();
});
```

### 11.2 Business Analytics

1. **Course Analytics**
   - Enrollment trends
   - Capacity utilization
   - Professor workload
   - Student preferences

2. **System Usage Analytics**
   - User activity patterns
   - Feature adoption
   - Performance metrics
   - Error rates

3. **Educational Analytics**
   - Course completion rates
   - Student satisfaction
   - Learning outcomes
   - Curriculum effectiveness

This comprehensive system architecture provides a robust foundation for the course selection system, addressing all the requirements outlined in the original design document while ensuring scalability, security, and maintainability.