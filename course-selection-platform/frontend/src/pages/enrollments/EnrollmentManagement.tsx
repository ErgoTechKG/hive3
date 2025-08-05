import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const EnrollmentManagement: React.FC = () => {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Enrollment Management
        </Typography>
        <Typography>Enrollment Management component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default EnrollmentManagement;