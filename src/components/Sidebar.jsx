import React, { useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Drawer, Toolbar, Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Tooltip, IconButton
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import {
  Dashboard, Inventory2, ViewInAr, Warning, QrCodeScanner, Storage,
  Logout, History as HistoryIcon, ReceiptLong, People, Assessment,
  Business, Router, PrecisionManufacturing, Email,
} from '@mui/icons-material';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import ulogo from '../assets/ulogo.png';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// ONE duration, shared by everything that changes on collapse/expand.
// Keeps width + padding + icon min-width + label fade in lockstep.
const WIDTH_MS = 220;
const WIDTH_TRANSITION = `width ${WIDTH_MS}ms ${EASE}`;

/* ---------- Keyframes (unchanged) ---------- */
const itemIn = keyframes`
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(-4px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const iconPop = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.3) rotate(-8deg); }
  70%  { transform: scale(0.95) rotate(3deg); }
  100% { transform: scale(1) rotate(0); }
`;
const dotPop = keyframes`
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.6); opacity: 1; }
  100% { transform: scale(1); }
`;
const dotPulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(91, 91, 214, 0.45); }
  100% { box-shadow: 0 0 0 7px rgba(91, 91, 214, 0); }
`;

const REDUCED = '@media (prefers-reduced-motion: reduce)';
const noMotion = { [REDUCED]: { animation: 'none !important', transition: 'none !important' } };

function SidebarInner({ collapsed, onClose, animate = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const roleId = user?.role_id;

  const navItems = useMemo(() => {
    const items = [
      { label: 'Overview', path: '/dashboard', icon: <Dashboard fontSize="small" /> },
      { label: 'Assets', path: '/assets', icon: <Inventory2 fontSize="small" /> },
      { label: 'Containers', path: '/containers', icon: <ViewInAr fontSize="small" /> },
      { label: 'Scanner', path: '/scanner', icon: <QrCodeScanner fontSize="small" /> },
      { label: 'Reports', path: '/reports', icon: <Assessment fontSize="small" /> },
    ];
    if (roleId === 1 || roleId === 2) {
      items.push({ label: 'Exceptions', path: '/exceptions', icon: <Warning fontSize="small" /> });
      items.push({ label: 'Challans', path: '/challans', icon: <ReceiptLong fontSize="small" /> });
      items.push({ label: 'History', path: '/history', icon: <HistoryIcon fontSize="small" /> });
      items.push({ label: 'Warehouse Sandbox', path: '/rfid-warehouse-sandbox', icon: <PrecisionManufacturing fontSize="small" /> });
    }
    if (roleId === 1) {
      items.push({ label: 'Clients', path: '/clients', icon: <Business fontSize="small" /> });
      items.push({ label: 'Devices', path: '/devices', icon: <Router fontSize="small" /> });
      items.push({ label: 'Database', path: '/admin', icon: <Storage fontSize="small" /> });
      items.push({ label: 'Users', path: '/users', icon: <People fontSize="small" /> });
      items.push({ label: 'Email Settings', path: '/email-settings', icon: <Email fontSize="small" /> });
    }
    return items;
  }, [roleId]);

  /* ---------- Sliding active indicator ---------- */
  const listRef = useRef(null);
  const itemRefs = useRef({});
  const [indicator, setIndicator] = useState(null);
  const [indicatorReady, setIndicatorReady] = useState(false);

  const activePath = navItems.find((i) => i.path === location.pathname)?.path;

  // Debounce the ResizeObserver so it doesn't fire 20× during the width transition.
  const rafRef = useRef(null);
  const measure = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = activePath ? itemRefs.current[activePath] : null;
      if (!el || el.offsetWidth === 0) {
        setIndicator((prev) => (prev === null ? prev : null));
        return;
      }
      const next = { top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight };
      setIndicator((prev) =>
        prev && prev.top === next.top && prev.left === next.left &&
        prev.width === next.width && prev.height === next.height ? prev : next
      );
    });
  }, [activePath]);

  useLayoutEffect(() => {
    measure();
    let ro;
    if (typeof ResizeObserver !== 'undefined' && listRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(listRef.current);
    }
    return () => {
      ro && ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [measure, collapsed, navItems.length]);

  useLayoutEffect(() => {
    if (indicator && !indicatorReady) {
      const id = requestAnimationFrame(() => setIndicatorReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, [indicator, indicatorReady]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavItem = (item, index) => {
    const active = location.pathname === item.path;
    const button = (
      <ListItemButton
        ref={(el) => { itemRefs.current[item.path] = el; }}
        component={NavLink}
        to={item.path}
        onClick={onClose}
        sx={{
          position: 'relative',
          zIndex: 1,
          mb: 0.5,
          borderRadius: 2,
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 1.5 : 2,
          color: active ? '#5B5BD6' : '#344054',
          bgcolor: 'transparent',
          // ↓ Match the width transition timing so padding eases in lockstep.
          //   Don't transition `color` here — it fights the indicator.
          transition: animate
            ? `padding ${WIDTH_MS}ms ${EASE}, background-color 0.15s ${EASE}, transform 0.15s ${EASE}`
            : 'none',
          animation: animate ? `${itemIn} 0.35s ${EASE} both` : 'none',
          animationDelay: animate ? `${index * 30}ms` : '0ms',
          '&:hover': {
            bgcolor: active ? 'transparent' : '#F9FAFB',
            transform: active ? 'none' : 'translateX(3px)',
          },
          '&:active': { transform: 'scale(0.97)' },
          '& .MuiListItemIcon-root': {
            color: active ? '#5B5BD6' : '#667085',
            minWidth: collapsed ? 0 : 32,
            justifyContent: 'center',
            // ↓ No `min-width` transition — it causes sub-pixel jitter.
            //   Instead let the icon snap; the width change dominates visually.
            transition: animate ? `color 0.15s ${EASE}, transform 0.2s ${SPRING}` : 'none',
            animation: active ? `${iconPop} 0.45s ${EASE}` : 'none',
          },
          '&:hover .MuiListItemIcon-root': { transform: active ? 'none' : 'scale(1.15)' },
          ...noMotion,
        }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        {!collapsed && (
          <ListItemText
            primaryTypographyProps={{
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              whiteSpace: 'nowrap',
            }}
            sx={{
              // ↓ Key fix: don't restart the fade on every re-render.
              //   Use opacity only, and let it fade with the width transition.
              opacity: 1,
              transition: animate ? `opacity 0.18s ${EASE} ${WIDTH_MS * 0.3}ms` : 'none',
              '& .MuiTypography-root': { transition: `font-weight 0.15s ${EASE}` },
              ...noMotion,
            }}
          >
            {item.label}
          </ListItemText>
        )}
        {!collapsed && active && (
          <Box
            sx={{
              width: 6, height: 6, borderRadius: '50%', bgcolor: '#5B5BD6',
              animation: animate
                ? `${dotPop} 0.35s ${SPRING} both, ${dotPulse} 1.2s ${EASE} 0.25s 1`
                : 'none',
              ...noMotion,
            }}
          />
        )}
      </ListItemButton>
    );

    return collapsed ? (
      <Tooltip key={item.path} title={item.label} placement="right" arrow disableInteractive>
        {button}
      </Tooltip>
    ) : (
      <React.Fragment key={item.path}>{button}</React.Fragment>
    );
  };

  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';
  const roleName = roleId === 1 ? 'Super Admin' : roleId === 2 ? 'Admin' : 'Operator';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Toolbar
        sx={{
          px: collapsed ? 1 : 2,
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: '64px !important',
          // Match width timing exactly
          transition: animate ? `padding ${WIDTH_MS}ms ${EASE}` : 'none',
        }}
      >
        <Avatar
          variant="rounded"
          src={ulogo}
          sx={{
            width: 32, height: 32, borderRadius: 2, mr: collapsed ? 0 : 1, bgcolor: '#fff',
            transition: animate ? `margin ${WIDTH_MS}ms ${EASE}, transform 0.3s ${SPRING}` : 'none',
            cursor: 'default',
            '&:hover': { transform: 'rotate(-8deg) scale(1.1)' },
            ...noMotion,
          }}
        >
          U
        </Avatar>
        {!collapsed && (
          <Box sx={{ minWidth: 0, animation: animate ? `${fadeIn} 0.3s ${EASE} both` : 'none', ...noMotion }}>
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 700, fontSize: 15, lineHeight: 1.2,
                whiteSpace: 'nowrap', letterSpacing: '-0.5px',
              }}
            >
              UnoTrace
            </Typography>
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 400, fontSize: 11.5, color: '#667085',
                whiteSpace: 'nowrap', letterSpacing: '0.1px',
              }}
            >
              Trust & Accuracy in Tracking
            </Typography>
          </Box>
        )}
      </Toolbar>
      <Divider />

      <List
        ref={listRef}
        sx={{
          position: 'relative',
          px: collapsed ? 0.5 : 1,
          py: 1.5,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: animate ? `padding ${WIDTH_MS}ms ${EASE}` : 'none',
          scrollbarGutter: 'stable',
        }}
      >
        {indicator && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute', top: 0, left: 0, zIndex: 0,
              width: indicator.width,
              height: indicator.height,
              transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
              borderRadius: 2,
              bgcolor: '#F4F3FF',
              pointerEvents: 'none',
              transition: indicatorReady
                ? `transform ${WIDTH_MS}ms ${EASE}, width ${WIDTH_MS}ms ${EASE}, height ${WIDTH_MS}ms ${EASE}`
                : 'none',
              '&::before': {
                content: '""',
                position: 'absolute', left: 0, top: '22%', bottom: '22%',
                width: 3, borderRadius: '0 3px 3px 0',
                bgcolor: '#5B5BD6',
                opacity: collapsed ? 0 : 1,
                transition: animate ? `opacity ${WIDTH_MS}ms ${EASE}` : 'none',
              },
              ...noMotion,
            }}
          />
        )}
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
          // Keep the box height stable during collapse so nothing jumps
          minHeight: 64,
          transition: animate ? `padding ${WIDTH_MS}ms ${EASE}` : 'none',
          animation: animate ? `${fadeUp} 0.4s ${EASE} 0.1s both` : 'none',
          ...noMotion,
        }}
      >
        <Tooltip title={collapsed ? `${user?.username} (${roleName})` : ''} placement="right" arrow disableInteractive>
          <Avatar
            sx={{
              width: 32, height: 32,
              bgcolor: roleId === 1 ? '#F04438' : roleId === 2 ? '#5B5BD6' : '#12B76A',
              fontSize: 13, flexShrink: 0,
              transition: animate ? `transform 0.25s ${SPRING}, box-shadow 0.15s ${EASE}` : 'none',
              '&:hover': { transform: 'scale(1.1)', boxShadow: '0 2px 8px rgba(16,24,40,0.18)' },
              ...noMotion,
            }}
          >
            {initial}
          </Avatar>
        </Tooltip>

        {!collapsed && (
          <>
            <Box
              sx={{
                flex: 1, minWidth: 0, overflow: 'hidden',
                animation: animate ? `${fadeIn} 0.25s ${EASE} both` : 'none',
                ...noMotion,
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {user?.username}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#667085', whiteSpace: 'nowrap' }}>
                {roleName}
              </Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton
                size="small"
                onClick={handleLogout}
                sx={{
                  color: '#F04438',
                  transition: animate ? `background-color 0.15s ${EASE}, transform 0.15s ${EASE}` : 'none',
                  '&:hover': { bgcolor: '#FEF3F2', transform: 'translateX(2px)' },
                  '&:active': { transform: 'scale(0.9)' },
                  ...noMotion,
                }}
              >
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
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width,
          flexShrink: 0,
          transition: WIDTH_TRANSITION,
          '& .MuiDrawer-paper': {
            width,
            boxSizing: 'border-box',
            borderRight: '1px solid #EAECF0',
            overflowX: 'hidden',
            overflowY: 'hidden',
            transition: WIDTH_TRANSITION,
            willChange: 'width',
          },
        }}
      >
        <SidebarInner collapsed={collapsed} />
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            // Slide in with a snappier curve
            transition: `transform ${WIDTH_MS}ms ${EASE} !important`,
          },
        }}
      >
        <SidebarInner collapsed={false} onClose={onClose} animate={mobileOpen} />
      </Drawer>
    </>
  );
}

export { DRAWER_WIDTH, COLLAPSED_WIDTH };