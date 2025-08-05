// import React from 'react'; // Not needed with new JSX transform
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SnackbarProvider } from 'notistack';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

import { store, persistor } from './store';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Layouts
import PrivateRoute from './components/common/PrivateRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardRouter from './components/common/DashboardRouter';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Role-specific dashboards

// Common pages
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Course pages
import CourseList from './pages/courses/CourseList';
import CourseDetails from './pages/courses/CourseDetails';
import CreateCourse from './pages/courses/CreateCourse';
import EditCourse from './pages/courses/EditCourse';

// Task pages
import TaskList from './pages/tasks/TaskList';
import TaskDetails from './pages/tasks/TaskDetails';
import CreateTask from './pages/tasks/CreateTask';

// Enrollment pages
import EnrollmentPreferences from './pages/enrollments/EnrollmentPreferences';
import EnrollmentStatus from './pages/enrollments/EnrollmentStatus';
import EnrollmentManagement from './pages/enrollments/EnrollmentManagement';

// Analytics pages
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import CourseAnalytics from './pages/analytics/CourseAnalytics';
import AnnualReport from './pages/analytics/AnnualReport';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
              <Router>
                <AuthProvider>
                  <SocketProvider>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />

                      {/* Private routes */}
                      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                          {/* Role-based dashboard routes */}
                          <Route path="/" element={<DashboardRouter />} />
                          
                          {/* Common routes */}
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/settings" element={<Settings />} />
                          
                          {/* Course routes */}
                          <Route path="/courses" element={<CourseList />} />
                          <Route path="/courses/:id" element={<CourseDetails />} />
                          <Route path="/courses/create" element={<CreateCourse />} />
                          <Route path="/courses/:id/edit" element={<EditCourse />} />
                          
                          {/* Task routes */}
                          <Route path="/tasks" element={<TaskList />} />
                          <Route path="/tasks/:id" element={<TaskDetails />} />
                          <Route path="/tasks/create" element={<CreateTask />} />
                          
                          {/* Enrollment routes */}
                          <Route path="/enrollments/preferences" element={<EnrollmentPreferences />} />
                          <Route path="/enrollments/status" element={<EnrollmentStatus />} />
                          <Route path="/enrollments/manage" element={<EnrollmentManagement />} />
                          
                          {/* Analytics routes */}
                          <Route path="/analytics" element={<AnalyticsDashboard />} />
                          <Route path="/analytics/courses" element={<CourseAnalytics />} />
                          <Route path="/analytics/annual-report" element={<AnnualReport />} />
                      </Route>

                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </SocketProvider>
                </AuthProvider>
              </Router>
            </SnackbarProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}



export default App;