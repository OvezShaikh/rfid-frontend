import React, { useState } from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import { WhatsApp } from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom'; // Added useNavigate, useLocation
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Hide the FAB if we are already on the WhatsApp page
  const isWhatsAppPage = location.pathname === '/whatsapp';

  // Only Super Admin (1) and Admin (2) can see the FAB
  const canAccessBot = user?.role_id === 1 || user?.role_id === 2;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F8FA' }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />
        
        {/* Main Content Area */}
        <Box sx={{ p: { xs: 2, md: 3 }, flex: 1 }}>
          <Outlet />
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FLOATING WHATSAPP BOT BUTTON */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {canAccessBot && !isWhatsAppPage && (
        <Tooltip title="Chat with RFID Assistant" placement="left" arrow>
          <Fab
            color="success"
            aria-label="whatsapp"
            onClick={() => navigate('/whatsapp')}
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              bgcolor: '#25D366', // Official WhatsApp Green
              color: '#fff',
              width: 64,
              height: 64,
              boxShadow: '0px 8px 24px rgba(37, 211, 102, 0.4)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: '#128C7E', // Darker green on hover
                transform: 'scale(1.05) translateY(-4px)',
                boxShadow: '0px 12px 28px rgba(37, 211, 102, 0.5)',
              },
              // Slight pulse animation to attract attention
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.7)' },
                '70%': { boxShadow: '0 0 0 15px rgba(37, 211, 102, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0)' },
              }
            }}
          >
            <WhatsApp sx={{ fontSize: 32 }} />
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
}