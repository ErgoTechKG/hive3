import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import StudentDashboard from '../../pages/dashboards/StudentDashboard';
import ProfessorDashboard from '../../pages/dashboards/ProfessorDashboard';
import SecretaryDashboard from '../../pages/dashboards/SecretaryDashboard';
import LeaderDashboard from '../../pages/dashboards/LeaderDashboard';

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'professor':
      return <ProfessorDashboard />;
    case 'secretary':
      return <SecretaryDashboard />;
    case 'leader':
      return <LeaderDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default DashboardRouter;