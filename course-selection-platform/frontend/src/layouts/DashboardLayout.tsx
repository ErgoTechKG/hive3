import React from 'react';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

const DashboardLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default DashboardLayout;