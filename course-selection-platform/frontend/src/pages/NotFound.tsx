import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          The page you are looking for does not exist.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go Home
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;