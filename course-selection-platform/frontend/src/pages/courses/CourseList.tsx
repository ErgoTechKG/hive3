import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const CourseList: React.FC = () => {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Course List
        </Typography>
        <Typography>Course List component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default CourseList;