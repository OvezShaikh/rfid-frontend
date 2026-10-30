import React from 'react';
import {
  Drawer, Toolbar, Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Chip, Tooltip
} from '@mui/material';
import {
  Dashboard, Inventory2, ViewInAr, Warning, QrCodeScanner, Storage
} from '@mui/icons-material';
import { NavLink, useLocation } from 'react-router-dom';
import ulogo from '../assets/ulogo.png';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

const navItems = [
  { label: 'Overview', path: '/', icon: <Dashboard fontSize="small" /> },
  { label: 'Assets', path: '/assets', icon: <Inventory2 fontSize="small" /> },
  { label: 'Containers', path: '/containers', icon: <ViewInAr fontSize="small" /> },
  { label: 'Scanner', path: '/scanner', icon: <QrCodeScanner fontSize="small" /> },
  { label: 'Exceptions', path: '/exceptions', icon: <Warning fontSize="small" /> },
  { label: 'Database', path: '/admin', icon: <Storage fontSize="small" /> },
];

// ── The visual body, reusable for both desktop & mobile ──
function SidebarInner({ collapsed, onClose }) {
  const location = useLocation();

  const renderNavItem = (item) => {
    const active = location.pathname === item.path;
    const button = (
      <ListItemButton
        component={NavLink}
        to={item.path}
        onClick={onClose}
        sx={{
          mb: 0.5,
          borderRadius: 2,
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
            primaryTypographyProps={{
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              noWrap: true,
            }}
          >
            {item.label}
          </ListItemText>
        )}
        {!collapsed && active && (
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#5B5BD6' }} />
        )}
      </ListItemButton>
    );

    return collapsed ? (
      <Tooltip key={item.path} title={item.label} placement="right" arrow>
        {button}
      </Tooltip>
    ) : (
      <React.Fragment key={item.path}>{button}</React.Fragment>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          px: collapsed ? 1 : 2,
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: '64px !important',
        }}
      >
        <Avatar
          variant="rounded"
          src={ulogo}
          alt="Unostar"
          sx={{ width: 32, height: 32, borderRadius: 2, mr: collapsed ? 0 : 1.5, bgcolor: '#ffff', fontSize: 14, fontWeight: 800 }}
        >
          U
        </Avatar>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              Unostar RFID
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>
              Packaging Pool
            </Typography>
          </Box>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ px: collapsed ? 0.5 : 1, py: 1.5, flex: 1 }}>
        {navItems.map(renderNavItem)}
      </List>
      <Divider />
      <Box
        sx={{
          p: collapsed ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1.5,
        }}
      >
        <Tooltip title={collapsed ? 'R. Jadhav · Operator' : ''} placement="right" arrow>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#5B5BD6', fontSize: 13, flexShrink: 0 }}>
            RJ
          </Avatar>
        </Tooltip>
        {!collapsed && (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>R. Jadhav</Typography>
              <Typography sx={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>Operator</Typography>
            </Box>
            <Chip label="Live" size="small" color="success" sx={{ height: 18, fontSize: 10 }} />
          </>
        )}
      </Box>
    </Box>
  );
}

// ── Public component ──
export default function Sidebar({ mobileOpen, onClose, collapsed = false }) {
  const width = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <>
      {/* Desktop — permanent, collapsible */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width,
          flexShrink: 0,
          transition: 'width 0.2s ease',
          '& .MuiDrawer-paper': {
            width,
            boxSizing: 'border-box',
            borderRight: '1px solid #EAECF0',
            overflowX: 'hidden',
            transition: 'width 0.2s ease',
          },
        }}
      >
        <SidebarInner collapsed={collapsed} />
      </Drawer>

      {/* Mobile — temporary, always full-width */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <SidebarInner collapsed={false} onClose={onClose} />
      </Drawer>
    </>
  );
}

export { DRAWER_WIDTH, COLLAPSED_WIDTH };