import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, InputBase,
  Badge, Avatar, Button, Tooltip, Paper, List, ListItemButton,
  ListItemText, Chip
} from '@mui/material';
import {
  Menu as MenuIcon, MenuOpen, Menu as MenuClosed, Search,
  NotificationsNone, Add, Inventory2, Layers, DensityMedium
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAssets, getContainers } from '../services/api';

const TYPE_ICON = {
  Pallet: <Inventory2 fontSize="small" sx={{ color: '#F5B041' }} />,
  Sleeve: <Layers fontSize="small" sx={{ color: '#2E90FA' }} />,
  Lid: <DensityMedium fontSize="small" sx={{ color: '#5B5BD6' }} />,
};

export default function TopBar({ onMenuClick, onToggleCollapse, collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [containers, setContainers] = useState([]);

  const fetchData = () => {
    Promise.all([getAssets(), getContainers()])
      .then(([a, c]) => {
        setAssets(a.data);
        setContainers(c.data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const q = query.toLowerCase();

    const assetMatches = assets
      .filter(a =>
        a.asset_id?.toLowerCase().includes(q) ||
        a.rfid_tag_id?.toLowerCase().includes(q) ||
        a.set_id?.toLowerCase().includes(q)
      )
      .map(a => ({ kind: 'asset', ...a }));

    const containerMatches = containers
      .filter(c => c.set_id?.toLowerCase().includes(q))
      .map(c => ({ kind: 'container', ...c }));

    const combined = [...assetMatches, ...containerMatches].slice(0, 8);
    setResults(combined);
    setOpen(combined.length > 0);
  }, [query, assets, containers]);

  const handleSelect = (item) => {
    setOpen(false);
    setQuery('');
    if (item.kind === 'asset') {
      navigate('/assets', { state: { searchAssetId: item.id } });
    } else {
      navigate('/containers', { state: { searchSetId: item.set_id } });
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#FFFFFF',
        color: '#101828',
        borderBottom: '1px solid #EAECF0',
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: 64, px: { xs: 1, sm: 2 } }}>
        {/* Mobile hamburger */}
        <IconButton
          onClick={onMenuClick}
          sx={{ display: { md: 'none' } }}
          aria-label="Open menu"
        >
          <MenuIcon />
        </IconButton>

        {/* Desktop collapse toggle */}
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} arrow>
          <IconButton
            onClick={onToggleCollapse}
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <MenuOpen /> : <MenuClosed />}
          </IconButton>
        </Tooltip>

        {/* Hide Title on mobile to give search room */}
        <Typography sx={{ fontWeight: 700, fontSize: 16, mr: 2, display: { xs: 'none', md: 'block' } }}>
          Dashboard
        </Typography>

        {/* ── Search Area (Visible on all screens) ── */}
        <Box sx={{ position: 'relative', flex: 1, maxWidth: { xs: '100%', sm: 400 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: '1px solid #EAECF0',
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              bgcolor: '#FFFFFF',
            }}
          >
            <Search fontSize="small" sx={{ color: '#667085' }} />
            <InputBase
              placeholder="Search asset, tag, set ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                fetchData();
                if (query) setOpen(true);
              }}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              sx={{ flex: 1, fontSize: 13 }}
            />
          </Box>

          {/* Dropdown Results */}
          {open && results.length > 0 && (
            <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 1300,
                maxHeight: 360,
                overflow: 'auto',
                border: '1px solid #EAECF0',
              }}
            >
              <List dense disablePadding>
                {results.map((item) => (
                  <ListItemButton
                    key={`${item.kind}-${item.id}`}
                    onClick={() => handleSelect(item)}
                  >
                    <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                      {item.kind === 'asset' ? TYPE_ICON[item.type] : <Inventory2 fontSize="small" sx={{ color: '#5B5BD6' }} />}
                    </Box>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {item.kind === 'asset' ? item.asset_id : item.set_id}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ fontSize: 11, color: '#667085' }}>
                          {item.kind === 'asset'
                            ? `${item.type} · Tag: ${item.rfid_tag_id}`
                            : `Container · Status: ${item.status}`}
                        </Typography>
                      }
                    />
                    <Chip
                      label={item.kind === 'asset' ? 'Asset' : 'Set'}
                      size="small"
                      sx={{ fontSize: 10, height: 18 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}

          {/* No results */}
          {open && query.trim() && results.length === 0 && (
            <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                p: 2,
                zIndex: 1300,
                border: '1px solid #EAECF0',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No matches for "{query}"
              </Typography>
            </Paper>
          )}
        </Box>

        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

        {/* Hide New button on mobile */}
        <Button
          size="small"
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/assets')}
          sx={{ display: { xs: 'none', md: 'inline-flex' } }}
        >
          New
        </Button>

        {/* Hide notification bell on mobile */}
        <IconButton size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
          <Badge color="error" variant="dot">
            <NotificationsNone fontSize="small" />
          </Badge>
        </IconButton>

        <Avatar sx={{ width: 32, height: 32, bgcolor: '#5B5BD6', fontSize: 13, ml: 0.5 }}>
          TU
        </Avatar>
      </Toolbar>
    </AppBar>
  );
}