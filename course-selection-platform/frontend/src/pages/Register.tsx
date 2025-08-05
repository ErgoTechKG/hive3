import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const Register: React.FC = () => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Register
        </Typography>
        <Typography>Register component - Implementation pending</Typography>
      </Paper>
    </Box>
  );
};

export default Register;