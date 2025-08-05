import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const EditCourse: React.FC = () => {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Course
        </Typography>
        <Typography>Edit Course component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default EditCourse;