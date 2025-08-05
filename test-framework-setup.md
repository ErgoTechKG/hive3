# Test Framework Setup & Implementation Guide

## 🚀 Quick Start Testing Infrastructure

### 1. Package Dependencies
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "playwright": "^1.40.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.4",
    "faker": "^6.6.6",
    "artillery": "^2.0.0",
    "owasp-zap": "^1.0.0",
    "lighthouse": "^11.4.0"
  }
}
```

### 2. Test Configuration Files

#### jest.config.js
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js'
  ]
};
```

#### playwright.config.js
```javascript
module.exports = {
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Safari', use: { ...devices['Desktop Safari'] } }
  ]
};
```

### 3. Test Utilities & Helpers

#### tests/helpers/testData.js
```javascript
const faker = require('faker');

class TestDataFactory {
  static createUser(role = 'student') {
    return {
      id: faker.datatype.uuid(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: 'TestPass123!',
      role: role,
      profile: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        department: faker.random.arrayElement(['CS', 'EE', 'ME', 'CE']),
        year: faker.random.arrayElement([1, 2, 3, 4])
      }
    };
  }

  static createCourse(professorId) {
    return {
      id: faker.datatype.uuid(),
      title: faker.random.arrayElement([
        'Advanced Algorithms',
        'Machine Learning',
        'Database Systems',
        'Software Engineering',
        'Computer Networks'
      ]),
      code: `CS${faker.datatype.number({min: 100, max: 599})}`,
      professorId: professorId,
      capacity: faker.datatype.number({min: 20, max: 100}),
      schedule: {
        days: faker.random.arrayElements(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 2),
        time: `${faker.datatype.number({min: 9, max: 16})}:00-${faker.datatype.number({min: 10, max: 17})}:00`
      },
      prerequisites: [],
      description: faker.lorem.paragraph()
    };
  }

  static createTaskMessage(senderId, receiverId, type = 'action') {
    return {
      id: faker.datatype.uuid(),
      title: faker.random.arrayElement([
        'Upload Course Syllabus',
        'Submit Grade Report',
        'Review Course Proposal',
        'Update Student Records'
      ]),
      description: faker.lorem.sentence(),
      type: type, // 'read', 'action', 'approval'
      senderId: senderId,
      receiverId: receiverId,
      deadline: faker.date.future(),
      status: 'pending',
      priority: faker.random.arrayElement(['low', 'medium', 'high'])
    };
  }
}

module.exports = TestDataFactory;
```

#### tests/helpers/authHelper.js
```javascript
const jwt = require('jsonwebtoken');

class AuthHelper {
  static generateJWT(userId, role) {
    return jwt.sign(
      { 
        userId: userId, 
        role: role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      process.env.JWT_SECRET || 'test-secret'
    );
  }

  static async loginAs(request, role, userData = {}) {
    const user = TestDataFactory.createUser(role);
    Object.assign(user, userData);
    
    // Create user in test database
    await request.post('/api/auth/register').send(user);
    
    // Login and get token
    const response = await request
      .post('/api/auth/login')
      .send({
        username: user.username,
        password: user.password
      });
    
    return {
      user: user,
      token: response.body.token,
      headers: { 'Authorization': `Bearer ${response.body.token}` }
    };
  }
}

module.exports = AuthHelper;
```

### 4. Database Test Setup

#### tests/helpers/dbHelper.js
```javascript
const { Pool } = require('pg');

class DatabaseHelper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || 
        'postgresql://test_user:test_pass@localhost:5433/course_selection_test'
    });
  }

  async clearDatabase() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Clear all tables in correct order (respecting foreign keys)
      const tables = [
        'course_enrollments',
        'course_preferences', 
        'task_messages',
        'courses',
        'users'
      ];
      
      for (const table of tables) {
        await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async seedDatabase() {
    // Seed with basic test data
    const users = [
      TestDataFactory.createUser('leader'),
      TestDataFactory.createUser('secretary'),
      ...Array(5).fill().map(() => TestDataFactory.createUser('professor')),
      ...Array(100).fill().map(() => TestDataFactory.createUser('student'))
    ];

    for (const user of users) {
      await this.createUser(user);
    }

    return users;
  }

  async createUser(userData) {
    const query = `
      INSERT INTO users (id, username, email, password_hash, role, profile)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      userData.id,
      userData.username,
      userData.email,
      await bcrypt.hash(userData.password, 10),
      userData.role,
      JSON.stringify(userData.profile)
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = DatabaseHelper;
```

### 5. Example Test Implementations

#### tests/unit/auth/auth.test.js
```javascript
const request = require('supertest');
const app = require('../../../src/app');
const AuthHelper = require('../../helpers/authHelper');
const DatabaseHelper = require('../../helpers/dbHelper');

describe('Authentication API', () => {
  let dbHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseHelper();
    await dbHelper.clearDatabase();
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate valid user credentials and return JWT', async () => {
      // Arrange
      const userData = TestDataFactory.createUser('student');
      await request(app).post('/api/auth/register').send(userData);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('student');
      
      // Verify JWT contains correct claims
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.role).toBe('student');
      expect(decoded.userId).toBe(userData.id);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('JWT Middleware', () => {
    it('should protect routes requiring authentication', async () => {
      const response = await request(app)
        .get('/api/courses/my-courses')
        .send();

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });

    it('should allow access with valid JWT token', async () => {
      const { headers } = await AuthHelper.loginAs(request(app), 'professor');

      const response = await request(app)
        .get('/api/courses/my-courses')
        .set(headers);

      expect(response.status).toBe(200);
    });
  });
});
```

#### tests/integration/courseWorkflow.test.js
```javascript
const request = require('supertest');
const app = require('../../src/app');
const AuthHelper = require('../helpers/authHelper');
const DatabaseHelper = require('../helpers/dbHelper');

describe('Complete Course Selection Workflow', () => {
  let dbHelper;
  let professorAuth, secretaryAuth, leaderAuth, studentAuth;

  beforeAll(async () => {
    dbHelper = new DatabaseHelper();
    await dbHelper.clearDatabase();
    
    // Setup authenticated users for each role
    professorAuth = await AuthHelper.loginAs(request(app), 'professor');
    secretaryAuth = await AuthHelper.loginAs(request(app), 'secretary');
    leaderAuth = await AuthHelper.loginAs(request(app), 'leader');
    studentAuth = await AuthHelper.loginAs(request(app), 'student');
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  it('should complete full course lifecycle from creation to enrollment', async () => {
    // Step 1: Professor creates course
    const courseData = TestDataFactory.createCourse(professorAuth.user.id);
    const createResponse = await request(app)
      .post('/api/courses')
      .set(professorAuth.headers)
      .send(courseData);
    
    expect(createResponse.status).toBe(201);
    const courseId = createResponse.body.id;

    // Step 2: Leader approves course
    const approvalResponse = await request(app)
      .patch(`/api/courses/${courseId}/approve`)
      .set(leaderAuth.headers)
      .send({ approved: true, comments: 'Approved for this semester' });
    
    expect(approvalResponse.status).toBe(200);
    expect(approvalResponse.body.status).toBe('approved');

    // Step 3: Secretary publishes course
    const publishResponse = await request(app)
      .patch(`/api/courses/${courseId}/publish`)
      .set(secretaryAuth.headers)
      .send({ published: true });
    
    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.published).toBe(true);

    // Step 4: Student submits preferences
    const preferencesResponse = await request(app)
      .post('/api/course-preferences')
      .set(studentAuth.headers)
      .send({
        preferences: [
          { courseId: courseId, priority: 1 },
          // Additional preferences would go here
        ]
      });
    
    expect(preferencesResponse.status).toBe(201);

    // Step 5: Secretary runs matching algorithm
    const matchingResponse = await request(app)
      .post('/api/matching/run')
      .set(secretaryAuth.headers)
      .send({ semesterId: 'fall-2024' });
    
    expect(matchingResponse.status).toBe(200);

    // Step 6: Professor confirms selections
    const confirmResponse = await request(app)
      .patch(`/api/courses/${courseId}/confirm-enrollments`)
      .set(professorAuth.headers)
      .send({ confirmed: true });
    
    expect(confirmResponse.status).toBe(200);

    // Step 7: Verify final enrollment
    const enrollmentResponse = await request(app)
      .get(`/api/courses/${courseId}/enrollments`)
      .set(professorAuth.headers);
    
    expect(enrollmentResponse.status).toBe(200);
    expect(enrollmentResponse.body.enrollments.length).toBeGreaterThan(0);
  });
});
```

#### tests/e2e/student-journey.spec.js
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Student User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login as student
    await page.fill('[data-testid="username"]', 'test_student');
    await page.fill('[data-testid="password"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should complete course selection process', async ({ page }) => {
    // Navigate to course catalog
    await page.click('[data-testid="course-catalog"]');
    await expect(page.locator('.course-list')).toBeVisible();

    // Browse and filter courses
    await page.fill('[data-testid="search-courses"]', 'Machine Learning');
    await page.waitForSelector('.course-card');
    
    // View course details
    await page.click('.course-card:first-child');
    await expect(page.locator('.course-details')).toBeVisible();
    
    // Add to preferences
    await page.click('[data-testid="add-to-preferences"]');
    await expect(page.locator('.success-message')).toBeVisible();

    // Navigate to preferences page
    await page.click('[data-testid="my-preferences"]');
    await expect(page.locator('.preferences-list')).toBeVisible();

    // Reorder preferences (drag and drop)
    const firstPreference = page.locator('.preference-item:first-child');
    const secondPreference = page.locator('.preference-item:nth-child(2)');
    await firstPreference.dragTo(secondPreference);

    // Submit preferences
    await page.click('[data-testid="submit-preferences"]');
    await expect(page.locator('.confirmation-dialog')).toBeVisible();
    await page.click('[data-testid="confirm-submit"]');

    // Verify submission success
    await expect(page.locator('.success-message')).toContainText('Preferences submitted successfully');
  });

  test('should check enrollment results and confirm', async ({ page }) => {
    // Navigate to enrollment results
    await page.click('[data-testid="enrollment-results"]');
    
    // Check if results are available
    const resultsAvailable = await page.locator('.results-available').isVisible();
    
    if (resultsAvailable) {
      // View enrollment results
      await expect(page.locator('.enrollment-list')).toBeVisible();
      
      // Confirm enrollment for accepted courses
      const acceptedCourses = page.locator('.course-accepted');
      const count = await acceptedCourses.count();
      
      for (let i = 0; i < count; i++) {
        await acceptedCourses.nth(i).locator('[data-testid="confirm-enrollment"]').click();
      }
      
      // Submit final confirmation
      await page.click('[data-testid="submit-confirmations"]');
      await expect(page.locator('.confirmation-success')).toBeVisible();
    } else {
      // Results not yet available
      await expect(page.locator('.results-pending')).toBeVisible();
    }
  });

  test('should utilize social networking features', async ({ page }) => {
    // Navigate to social/networking section
    await page.click('[data-testid="social-network"]');
    
    // Search for other students
    await page.fill('[data-testid="search-students"]', 'John');
    await page.click('[data-testid="search-button"]');
    
    // Send connection request
    await page.click('.student-card:first-child [data-testid="connect"]');
    await expect(page.locator('.connection-sent')).toBeVisible();
    
    // Join study group
    await page.click('[data-testid="study-groups"]');
    await page.click('.study-group:first-child [data-testid="join-group"]');
    await expect(page.locator('.group-joined')).toBeVisible();
    
    // Post in group discussion
    await page.fill('[data-testid="discussion-input"]', 'Looking for study partners for midterm');
    await page.click('[data-testid="post-message"]');
    await expect(page.locator('.message-posted')).toBeVisible();
  });
});
```

### 6. Performance Testing Setup

#### tests/performance/load-test.yml
```yaml
# Artillery.io load testing configuration
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm-up"
    - duration: 300
      arrivalRate: 50
      name: "Peak enrollment period"
    - duration: 120
      arrivalRate: 100
      name: "Rush hour simulation"
  
scenarios:
  - name: "Course Selection Flow"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            username: "student_{{ $randomInt(1, 1000) }}"
            password: "TestPass123!"
      - get:
          url: "/api/courses"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/api/course-preferences"
          json:
            preferences: [
              { courseId: "{{ courseId }}", priority: 1 }
            ]
  
  - name: "Dashboard Loading"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            username: "user_{{ $randomInt(1, 100) }}"
            password: "TestPass123!"
      - get:
          url: "/api/dashboard/stats"
          headers:
            Authorization: "Bearer {{ token }}"
```

### 7. Security Testing

#### tests/security/security.test.js
```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('Security Tests', () => {
  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in course search', async () => {
      const maliciousPayload = "'; DROP TABLE courses; --";
      
      const response = await request(app)
        .get('/api/courses/search')
        .query({ q: maliciousPayload });
      
      // Should not return 500 error (would indicate SQL injection vulnerability)
      expect(response.status).not.toBe(500);
      
      // Verify courses table still exists by making a normal request
      const normalResponse = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(normalResponse.status).toBe(200);
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize course descriptions', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          title: 'Test Course',
          description: xssPayload
        });
      
      expect(response.body.description).not.toContain('<script>');
      expect(response.body.description).toContain('&lt;script&gt;');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      const attempts = Array(10).fill().map(() => 
        request(app)
          .post('/api/auth/login')
          .send({ username: 'test', password: 'wrong' })
      );
      
      const responses = await Promise.all(attempts);
      const tooManyRequests = responses.filter(r => r.status === 429);
      
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });
});
```

This framework setup provides a complete testing infrastructure that implements the comprehensive test plan with realistic examples and proper tooling configuration.