import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const ForgotPassword: React.FC = () => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Forgot Password
        </Typography>
        <Typography>Forgot Password component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;