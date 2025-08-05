# Course Selection Platform

A comprehensive full-stack application for university course selection and management, built with modern technologies and best practices.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based secure authentication
- **Course Management** - CRUD operations for courses, prerequisites, and schedules
- **Student Enrollment** - Course selection with conflict detection
- **Real-time Updates** - Socket.IO for live notifications
- **Responsive Design** - Material-UI components with mobile-first approach
- **Type Safety** - Full TypeScript implementation
- **Testing** - Comprehensive test coverage with Jest
- **Docker Support** - Containerized deployment
- **API Documentation** - Swagger/OpenAPI documentation

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for session management and caching
- **Authentication**: JWT with refresh tokens
- **Validation**: Joi for request validation
- **Testing**: Jest with Supertest
- **Documentation**: Swagger/OpenAPI

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **UI Components**: Material-UI (MUI)
- **Routing**: React Router v6
- **Forms**: Formik with Yup validation
- **HTTP Client**: Axios with React Query
- **Testing**: Jest with React Testing Library

## 📁 Project Structure

```
course-selection-platform/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Application entry point
│   ├── tests/              # Test files
│   ├── Dockerfile          # Docker configuration
│   └── package.json        # Dependencies and scripts
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── App.tsx         # Main App component
│   ├── public/             # Static assets
│   ├── tests/              # Test files
│   ├── Dockerfile          # Docker configuration
│   └── package.json        # Dependencies and scripts
├── docker-compose.yml      # Multi-container setup
└── README.md              # Project documentation
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (v7 or higher)
- Redis (v7 or higher)
- Docker & Docker Compose (optional)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd course-selection-platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

4. **Database Setup**
   - Start MongoDB and Redis services
   - Run database migrations: `npm run migrate`
   - Seed initial data: `npm run seed`

### Docker Development Setup

1. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

### Frontend Testing
```bash
cd frontend
npm test                    # Run all tests
npm run test:coverage      # Generate coverage report
```

## 📋 Available Scripts

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Frontend Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret

#### Frontend (.env)
- `REACT_APP_API_BASE_URL` - Backend API URL
- `REACT_APP_SOCKET_URL` - Socket.IO server URL

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## 📊 Monitoring & Logging

- **Backend Logging**: Winston with structured logging
- **Error Tracking**: Integrated error handling middleware
- **Health Checks**: Docker health checks configured
- **Performance**: Built-in performance monitoring

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention (using Mongoose)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📝 API Documentation

Once the backend is running, API documentation is available at:
- Swagger UI: http://localhost:3001/api-docs
- OpenAPI JSON: http://localhost:3001/api-docs.json

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Ensure MongoDB is running
   - Check connection string in .env file
   - Verify network connectivity

2. **Redis Connection Issues**
   - Ensure Redis is running
   - Check Redis URL in .env file
   - Verify Redis authentication

3. **Port Conflicts**
   - Check if ports 3000/3001 are available
   - Update PORT in .env files if needed

4. **Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify TypeScript configuration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team** - Full-stack development
- **QA Team** - Testing and quality assurance
- **DevOps Team** - Deployment and infrastructure

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki