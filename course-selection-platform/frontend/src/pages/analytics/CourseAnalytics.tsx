import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const CourseAnalytics: React.FC = () => {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Course Analytics
        </Typography>
        <Typography>Course Analytics component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default CourseAnalytics;