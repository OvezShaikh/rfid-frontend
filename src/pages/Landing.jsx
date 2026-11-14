import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

export default function Landing() {
  const navigate = useNavigate();

  // Optional: Auto-redirect to login after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f9fc', // Matches your 3D sandbox background
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      {/* Logo / Title */}
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: { xs: 40, md: 64 }, // Responsive size
          color: '#0A1929',
          letterSpacing: '-1.5px',
          lineHeight: 1.1,
          animation: 'fadeInDown 1s ease-out', // Add this animation in your CSS
        }}
      >
        UnoTrace
      </Typography>

      {/* Subheadline */}
      <Typography
        sx={{
          fontWeight: 400,
          fontSize: { xs: 16, md: 20 },
          color: '#667085',
          mt: 2,
          letterSpacing: '0.5px',
          animation: 'fadeInUp 1s ease-out 0.3s both',
        }}
      >
        Trust & Accuracy in Tracking
      </Typography>

      {/* Skip Button */}
      <Button
        onClick={() => navigate('/login')}
        sx={{
          mt: 6,
          color: '#00a3ff',
          fontWeight: 600,
          fontSize: 14,
          textTransform: 'none',
          animation: 'fadeIn 1s ease-out 1s both',
          '&:hover': { backgroundColor: 'transparent', color: '#0088d1' },
        }}
      >
        Skip Intro →
      </Button>

      {/* Injecting simple CSS animations for a premium feel */}
      <style>
        {`
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
}