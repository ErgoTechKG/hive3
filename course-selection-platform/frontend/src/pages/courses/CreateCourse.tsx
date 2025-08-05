import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const CreateCourse: React.FC = () => {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Course
        </Typography>
        <Typography>Create Course component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default CreateCourse;