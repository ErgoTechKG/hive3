import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const TaskDetails: React.FC = () => {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Task Details
        </Typography>
        <Typography>Task Details component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default TaskDetails;