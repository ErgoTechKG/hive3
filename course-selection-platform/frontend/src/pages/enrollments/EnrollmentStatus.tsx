import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const EnrollmentStatus: React.FC = () => {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Enrollment Status
        </Typography>
        <Typography>Enrollment Status component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default EnrollmentStatus;