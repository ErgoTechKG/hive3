# Local Development Setup Guide

This guide explains how to run the Course Selection Platform locally without Docker.

## Prerequisites

### 1. System Requirements
- macOS, Linux, or Windows with WSL2
- Node.js v18.0.0 or higher
- npm v8.0.0 or higher
- MongoDB 7.0 or higher
- Redis 7.0 or higher

### 2. Install MongoDB and Redis

#### macOS (using Homebrew):
```bash
# Add MongoDB tap
brew tap mongodb/brew

# Install MongoDB Community Edition
brew install mongodb-community@7.0

# Install Redis
brew install redis

# Start services
brew services start mongodb-community@7.0
brew services start redis
```

#### Linux (Ubuntu/Debian):
```bash
# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Redis
sudo apt-get install redis-server

# Start services
sudo systemctl start mongod
sudo systemctl start redis-server
```

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd course-selection-platform
```

### 2. Environment Configuration

The project includes pre-configured `.env` files for local development:

- **Backend:** `backend/.env` - Contains MongoDB, Redis, JWT, and other backend configurations
- **Frontend:** `frontend/.env` - Contains API URL configurations pointing to localhost:3001

Key configurations:
- Backend runs on port 3001
- Frontend runs on port 3000
- MongoDB connects to localhost:27017
- Redis connects to localhost:6379

### 3. Install Dependencies

#### Backend:
```bash
cd backend
npm install
npm install --save-dev @types/json2csv  # Required for TypeScript types
```

#### Frontend:
```bash
cd ../frontend
npm install --legacy-peer-deps  # Required due to peer dependency conflicts
```

### 4. Build the Applications

#### Backend (TypeScript compilation):
```bash
cd backend
npm run build
```

#### Frontend (optional, for production build):
```bash
cd ../frontend
npm run build
```

### 5. Start Development Servers

#### Start Backend:
```bash
cd backend
npm run dev
```
The backend will start on http://localhost:3001

#### Start Frontend (in a new terminal):
```bash
cd frontend
npm start
```
The frontend will start on http://localhost:3000

## Verify Installation

### 1. Check Backend Health
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-08-05T17:53:55.197Z",
  "uptime": 12.358607583,
  "environment": "development"
}
```

### 2. Check API Endpoints
```bash
curl http://localhost:3001/
```
Expected response:
```json
{
  "message": "Course Selection Platform API",
  "version": "1.0.0",
  "status": "Running",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth",
    "users": "/api/users",
    "courses": "/api/courses",
    "enrollments": "/api/enrollments",
    "tasks": "/api/tasks",
    "analytics": "/api/analytics"
  }
}
```

### 3. Access Frontend
Open your browser and navigate to http://localhost:3000

## Available Scripts

### Backend:
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Frontend:
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Troubleshooting

### Port Already in Use
If you get an error that port 3000 or 3001 is already in use:
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### MongoDB Connection Issues
Ensure MongoDB is running:
```bash
# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod
```

### Redis Connection Issues
Ensure Redis is running:
```bash
# macOS
brew services list | grep redis

# Linux
sudo systemctl status redis-server
```

### Frontend Memory Issues
If the frontend fails to start due to memory issues:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

### TypeScript Compilation Errors
If you encounter TypeScript errors:
```bash
# Rebuild the backend
cd backend
rm -rf dist
npm run build
```

## Database Management

### Connect to MongoDB:
```bash
mongosh
use courseselection
```

### Connect to Redis:
```bash
redis-cli
```

## Environment Variables

### Backend (.env):
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/courseselection
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

### Frontend (.env):
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_API_BASE_URL=http://localhost:3001
```

## Development Workflow

1. **Start services:** MongoDB and Redis must be running
2. **Start backend:** Run `npm run dev` in the backend directory
3. **Start frontend:** Run `npm start` in the frontend directory
4. **Make changes:** Both servers support hot reload
5. **Test changes:** Use the browser for frontend, curl/Postman for API
6. **Run tests:** Execute `npm test` in respective directories

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Support

For issues related to local development setup, please check:
1. All prerequisites are installed
2. Services (MongoDB, Redis) are running
3. Correct Node.js version is being used
4. Environment variables are properly configured

If problems persist, please create an issue with:
- Error messages
- System information (OS, Node version)
- Steps to reproduce the issue