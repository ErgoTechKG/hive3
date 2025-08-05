# Test Credentials for Course Selection Platform

## Default Test Users

Since this is a fresh installation, you'll need to create users first. The platform starts with no users in the database.

## How to Create Your First User

### Option 1: Register via UI
1. Navigate to http://localhost:3000/register
2. Fill in the registration form:
   - Username: testadmin
   - Email: admin@test.com
   - Password: Test123!@#
   - Role: Select your desired role (Student, Professor, Secretary, or Leader)
3. Click Register

### Option 2: Use the Seed Script
The backend includes a seed script to populate the database with test data:

```bash
cd backend
npm run seed
```

This will create several test users with different roles:
- Student accounts
- Professor accounts  
- Secretary account
- Leader account

### Option 3: Direct API Registration
You can also register directly via the API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testadmin",
    "email": "admin@test.com", 
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "Admin",
    "role": "leader"
  }'
```

## Available Roles
- **student**: Can enroll in courses, submit preferences
- **professor**: Can create and manage courses
- **secretary**: Can manage enrollments and generate reports
- **leader**: Full administrative access

## After Registration
Once you've created your first user, you can:
1. Login at http://localhost:3000/login
2. Access the dashboard based on your role
3. Create additional users if needed

## Important Notes
- Passwords must be at least 8 characters with uppercase, lowercase, number, and special character
- Email addresses must be unique
- Usernames must be unique
- The first time you run the app, the database will be empty