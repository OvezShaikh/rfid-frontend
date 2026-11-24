import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import {
  Box, Typography, Tabs, Tab, Button, IconButton, Tooltip, Chip,
  Collapse, Fade, Skeleton, Alert,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { Refresh, Add, Inventory2, ViewInAr } from '@mui/icons-material';
import AssemblyForm from '../components/AssemblyForm';
import ContainerTracker from '../components/ContainerTracker';
import { getAllContainers } from '../services/api';

// Lazy-load so three.js is only downloaded when this page is opened
const PackagingHero = lazy(() => import('../components/PackagingHero'));

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const PRIMARY = '#5B5BD6';
const HERO_KEY = 'containers.heroOpen';

export default function Containers() {
  const [tab, setTab] = useState(0);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHero, setShowHero] = useState(() => {
    try { return localStorage.getItem(HERO_KEY) !== 'closed'; } catch { return true; }
  });
  const tabsRef = useRef(null);

  const fetchContainers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllContainers();
      setContainers(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not load sets. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContainers(); }, [fetchContainers]);

  const goToAssemble = () => {
    setTab(1);
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAssembled = () => {
    fetchContainers();
    setTab(0); // Switch to tracker view after successful assembly
  };

  const toggleHero = () => {
    setShowHero((v) => {
      try { localStorage.setItem(HERO_KEY, v ? 'closed' : 'open'); } catch { /* ignore */ }
      return !v;
    });
  };

  return (
    <Box>
      {/* ── Header ───────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Set Management</Typography>
          <Typography variant="body2" sx={{ color: '#667085', maxWidth: 520 }}>
            Assemble new containers and track the exact components linked inside them.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={showHero ? 'Hide 3D preview' : 'Show 3D preview'}>
            <IconButton
              onClick={toggleHero}
              aria-pressed={showHero}
              sx={{
                border: '1px solid #EAECF0', borderRadius: 2.5, bgcolor: showHero ? '#F4F3FF' : '#fff',
                color: showHero ? PRIMARY : '#667085', transition: 'all .2s ease',
                '&:hover': { bgcolor: '#F4F3FF' },
              }}
            >
              <ViewInAr fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <span>
              <IconButton
                onClick={fetchContainers}
                disabled={loading}
                sx={{ border: '1px solid #EAECF0', borderRadius: 2.5, bgcolor: '#fff', color: '#667085', '&:hover': { bgcolor: '#F9FAFB' } }}
              >
                <Refresh fontSize="small" sx={{ animation: loading ? `${spin} 1s linear infinite` : 'none' }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* ── 3D hero (collapsible, unmounts when closed to free the GPU) ── */}
      <Collapse in={showHero} unmountOnExit timeout={400}>
        <Box sx={{ mb: 3 }}>
          <Suspense fallback={<Skeleton variant="rounded" height={380} sx={{ borderRadius: 4 }} />}>
            <PackagingHero height={380} ctaLabel="Assemble New Set" onCtaClick={goToAssemble} />
          </Suspense>
        </Box>
      </Collapse>

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2.5 }}
          action={<Button color="inherit" size="small" onClick={fetchContainers}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {/* ── Segmented tabs ───────────────────────────────────── */}
      <Box ref={tabsRef} sx={{ scrollMarginTop: 88, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          TabIndicatorProps={{ sx: { display: 'none' } }}
          sx={{
            minHeight: 0, width: 'fit-content', maxWidth: '100%', p: 0.5, borderRadius: 3,
            bgcolor: '#F2F4F7', border: '1px solid #EAECF0',
            '& .MuiTabs-flexContainer': { gap: 0.5 },
            '& .MuiTab-root': {
              minHeight: 38, px: 2, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, fontSize: 13.5,
              color: '#667085', transition: 'all .25s ease',
              '&:hover': { color: '#344054' },
              '&.Mui-selected': { color: PRIMARY, bgcolor: '#fff', boxShadow: '0 1px 3px rgba(16,24,40,.12)' },
            },
          }}
        >
          <Tab
            icon={<Inventory2 fontSize="small" />}
            iconPosition="start"
            label={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                Active Sets
                {!loading && (
                  <Chip
                    size="small"
                    label={containers.length}
                    sx={{ height: 20, fontSize: 11.5, fontWeight: 700, bgcolor: tab === 0 ? '#F4F3FF' : '#E4E7EC', color: tab === 0 ? PRIMARY : '#475467' }}
                  />
                )}
              </Box>
            }
          />
          <Tab icon={<Add fontSize="small" />} iconPosition="start" label="Assemble New Set" />
        </Tabs>
      </Box>

      {/* ── Content ────────────────────────────────────────── */}
      <Fade in key={tab} timeout={350}>
        <Box>
          {tab === 0 && (
            <ContainerTracker containers={containers} onRefresh={fetchContainers} loading={loading} />
          )}
          {tab === 1 && <AssemblyForm onAssembled={handleAssembled} />}
        </Box>
      </Fade>
    </Box>
  );
}