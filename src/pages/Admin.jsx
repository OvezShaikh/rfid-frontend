import React from 'react';
import { Box, Typography } from '@mui/material';
import AdminDashboard from '../components/AdminDashboard';

export default function Admin() {
  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>Database</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Raw view of every table — for debugging and audits
      </Typography>
      <AdminDashboard />
    </Box>
  );
}

//database view for admin users to see all tables and their contents