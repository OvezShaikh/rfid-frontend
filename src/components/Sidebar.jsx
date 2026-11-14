import React from 'react';
import {
  Drawer, Toolbar, Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Chip, Tooltip, IconButton
} from '@mui/material';
import {
  Dashboard, Inventory2, ViewInAr, Warning, QrCodeScanner, Storage, 
  Logout, History as HistoryIcon, ReceiptLong, People, Assessment,
  Business, Router, PrecisionManufacturing, Email,
} from '@mui/icons-material';
import { NavLink, useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import ulogo from '../assets/ulogo.png';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

function SidebarInner({ collapsed, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // <-- Get user and logout function
  
  const roleId = user?.role_id;

  // Build the navigation menu based on the user's role
  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: <Dashboard fontSize="small" /> },
    { label: 'Assets', path: '/assets', icon: <Inventory2 fontSize="small" /> },
    { label: 'Containers', path: '/containers', icon: <ViewInAr fontSize="small" /> },
    { label: 'Scanner', path: '/scanner', icon: <QrCodeScanner fontSize="small" /> },
    { label: 'Reports', path: '/reports', icon: <Assessment fontSize="small" /> }
  ];

  // Only Admin (1, 2) see Exceptions, Challans, and History
  if (roleId === 1 || roleId === 2) {
    navItems.push({ label: 'Exceptions', path: '/exceptions', icon: <Warning fontSize="small" /> });
    navItems.push({ label: 'Challans', path: '/challans', icon: <ReceiptLong fontSize="small" /> });
    navItems.push({ label: 'History', path: '/history', icon: <HistoryIcon fontSize="small" /> });
    navItems.push({ label: 'Warehouse Sandbox', path: '/rfid-warehouse-sandbox', icon: <PrecisionManufacturing fontSize="small" /> });
  }

  // Only Super Admin (1) sees the Database
  if (roleId === 1) {
    navItems.push({ label: 'Clients', path: '/clients', icon: <Business fontSize="small" /> });
    navItems.push({ label: 'Devices', path: '/devices', icon: <Router fontSize="small" /> });
    navItems.push({ label: 'Database', path: '/admin', icon: <Storage fontSize="small" /> });
    navItems.push({ label: 'Users', path: '/users', icon: <People fontSize="small" /> });
    navItems.push({ label: 'Email Settings', path: '/email-settings', icon: <Email fontSize="small" /> });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavItem = (item) => {
    const active = location.pathname === item.path;
    const button = (
      <ListItemButton
        component={NavLink}
        to={item.path}
        onClick={onClose}
        sx={{
          mb: 0.5, borderRadius: 2,
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 1.5 : 2,
          color: active ? '#5B5BD6' : '#344054',
          bgcolor: active ? '#F4F3FF' : 'transparent',
          '&:hover': { bgcolor: active ? '#F4F3FF' : '#F9FAFB' },
          '& .MuiListItemIcon-root': {
            color: active ? '#5B5BD6' : '#667085',
            minWidth: collapsed ? 0 : 32,
            justifyContent: 'center',
          },
        }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        {!collapsed && (
          <ListItemText 
            primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap' }}
          >
            {item.label}
          </ListItemText>
        )}
        {!collapsed && active && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#5B5BD6' }} />}
      </ListItemButton>
    );

    return collapsed ? (
      <Tooltip key={item.path} title={item.label} placement="right" arrow>{button}</Tooltip>
    ) : (
      <React.Fragment key={item.path}>{button}</React.Fragment>
    );
  };

  // Get user initial for Avatar
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';
  const roleName = roleId === 1 ? 'Super Admin' : roleId === 2 ? 'Admin' : 'Operator';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: collapsed ? 1 : 2, justifyContent: collapsed ? 'center' : 'flex-start', minHeight: '64px !important' }}>
        <Avatar variant="rounded" src={ulogo} sx={{ width: 32, height: 32, borderRadius: 2, mr: collapsed ? 0 : 1, bgcolor: '#fff' }}>U</Avatar>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 700,
                fontSize: 15, // Slightly increased to make the brand name pop
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.5px' // DM Sans looks great with slight negative tracking for headers
              }}
            >
              UnoTrace
            </Typography>

            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 400,
                fontSize: 11.5,
                color: '#667085',
                whiteSpace: 'nowrap',
                letterSpacing: '0.1px'
              }}
            >
              Trust & Accuracy in Tracking
            </Typography>
          </Box>
        )}
      </Toolbar>
      <Divider />
      
      <List sx={{ px: collapsed ? 0.5 : 1, py: 1.5, flex: 1 }}>
        {navItems.map(renderNavItem)}
      </List>

      <Divider />
      <Box sx={{ p: collapsed ? 1.5 : 2, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 1.5 }}>
        <Tooltip title={collapsed ? `${user?.username} (${roleName})` : ''} placement="right" arrow>
          <Avatar sx={{ width: 32, height: 32, bgcolor: roleId === 1 ? '#F04438' : roleId === 2 ? '#5B5BD6' : '#12B76A', fontSize: 13, flexShrink: 0 }}>
            {initial}
          </Avatar>
        </Tooltip>
        
        {!collapsed && (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{user?.username}</Typography>
              <Typography sx={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>{roleName}</Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton size="small" onClick={handleLogout} sx={{ color: '#F04438', '&:hover': { bgcolor: '#FEF3F2' } }}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
}

export default function Sidebar({ mobileOpen, onClose, collapsed = false }) {
  const width = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  return (
    <>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width, flexShrink: 0, transition: 'width 0.2s ease', '& .MuiDrawer-paper': { width, boxSizing: 'border-box', borderRight: '1px solid #EAECF0', overflowX: 'hidden', transition: 'width 0.2s ease' } }}>
        <SidebarInner collapsed={collapsed} />
      </Drawer>
      <Drawer variant="temporary" open={mobileOpen} onClose={onClose} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
        <SidebarInner collapsed={false} onClose={onClose} />
      </Drawer>
    </>
  );
}

export { DRAWER_WIDTH, COLLAPSED_WIDTH };