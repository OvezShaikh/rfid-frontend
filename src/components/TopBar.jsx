import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, InputBase,
  Badge, Avatar, Button, Tooltip, Paper, List, ListItemButton,
  ListItemText, Chip, CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon, MenuOpen, Menu as MenuClosed, Search,
  NotificationsNone, Add, Inventory2, Layers, Grid4x4, ViewStream
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAssets, getAllContainers } from '../services/api';
import lidImg from '../assets/lid.png';

const TYPE_ICON = {
  Pallet: <Inventory2 fontSize="small" sx={{ color: '#F5B041' }} />,
  Sleeve: <Layers fontSize="small" sx={{ color: '#2E90FA' }} />,
  Lid: (
    <Box component="img" src={lidImg} alt="Lid" sx={{ width: 18, height: 18, objectFit: 'contain', display: 'block' }} />
  ),
  Insert: <Grid4x4 fontSize="small" sx={{ color: '#E67E22' }} />,
  'Layer Pad': <ViewStream fontSize="small" sx={{ color: '#8E44AD' }} />,
};

export default function TopBar({ onMenuClick, onToggleCollapse, collapsed }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    setSearching(true);
    setOpen(true);

    const timer = setTimeout(async () => {
      try {
        // 1. Search Assets via API (Searches the whole DB, not just page 1)
        const assetRes = await getAssets(1, 5, query.trim()); 
        const assetMatches = assetRes.data.data.map(a => ({ kind: 'asset', ...a }));

        // 2. Search Containers
        const containerRes = await getAllContainers();
        const containerMatches = (containerRes.data || [])
          .filter(c => c.set_id?.toLowerCase().includes(query.toLowerCase()))
          .map(c => ({ kind: 'container', ...c }))
          .slice(0, 3);

        setResults([...assetMatches, ...containerMatches]);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    setOpen(false);
    setQuery('');
    if (item.kind === 'asset') {
      navigate('/assets', { state: { viewAssetId: item.id, timestamp: Date.now() } });
    } else {
      navigate('/containers', { state: { searchSetId: item.set_id, timestamp: Date.now() } });
    }
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#FFFFFF', color: '#101828', borderBottom: '1px solid #EAECF0' }}>
      <Toolbar sx={{ gap: 1, minHeight: 64, px: { xs: 1, sm: 2 } }}>
        <IconButton onClick={onMenuClick} sx={{ display: { md: 'none' } }}><MenuIcon /></IconButton>
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} arrow>
          <IconButton onClick={onToggleCollapse} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
            {collapsed ? <MenuOpen /> : <MenuClosed />}
          </IconButton>
        </Tooltip>

        <Box sx={{ position: 'relative', flex: 1, maxWidth: { xs: '100%', sm: 400 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #EAECF0', borderRadius: 2, px: 1.5, py: 0.5, bgcolor: '#FFFFFF' }}>
            <Search fontSize="small" sx={{ color: '#667085' }} />
            <InputBase
              placeholder="Search asset, tag, set ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (query) setOpen(true); }}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              sx={{ flex: 1, fontSize: 13 }}
            />
            {searching && <CircularProgress size={16} sx={{ color: '#667085' }} />}
          </Box>

          {open && (
            <Paper elevation={8} sx={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 1300, maxHeight: 360, overflow: 'auto', border: '1px solid #EAECF0' }}>
              <List dense disablePadding>
                {results.map((item) => (
                  <ListItemButton key={`${item.kind}-${item.id}`} onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}>
                    <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', width: 20, justifyContent: 'center' }}>
                      {item.kind === 'asset' ? (TYPE_ICON[item.type] || <Inventory2 fontSize="small" />) : <Inventory2 fontSize="small" sx={{ color: '#5B5BD6' }} />}
                    </Box>
                    <ListItemText
                      primary={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.kind === 'asset' ? item.asset_id : item.set_id}</Typography>}
                      secondary={<Typography sx={{ fontSize: 11, color: '#667085' }}>{item.kind === 'asset' ? `${item.type} · Tag: ${item.rfid_tag_id}` : `Container · Status: ${item.status}`}</Typography>}
                    />
                    <Chip label={item.kind === 'asset' ? 'Asset' : 'Set'} size="small" sx={{ fontSize: 10, height: 18 }} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
        <Button size="small" variant="contained" startIcon={<Add />} onClick={() => navigate('/assets')} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>New</Button>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#5B5BD6', fontSize: 13, ml: 0.5 }}>TU</Avatar>
      </Toolbar>
    </AppBar>
  );
}