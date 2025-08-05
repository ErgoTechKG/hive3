import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const CreateTask: React.FC = () => {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Task
        </Typography>
        <Typography>Create Task component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default CreateTask;