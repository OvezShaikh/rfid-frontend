import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Avatar, Button, CircularProgress, Divider, IconButton } from '@mui/material';
import {
  Inventory2, ViewInAr, Warning, CheckCircle, ArrowForward, QrCodeScanner, MoreHoriz
} from '@mui/icons-material';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, BarChart, Bar, Cell
} from 'recharts';
import IndiaMap from '../components/IndiaMap';
import KpiCard from '../components/KpiCard';
import { getAssets, getContainers, getExceptions, getAdminStats, getScanTrend } from '../services/api';
import { useNavigate } from 'react-router-dom';

// ── Asset location resolver ──────────────────────────────────────────
// Try multiple field names — adjust this list to match YOUR API shape.
const LOCATION_FIELDS = [
  'location', 'location_name',
  'site', 'site_name',
  'warehouse', 'warehouse_name',
  'current_location', 'hub', 'plant',
];

// Normalize a location value that could be a string or an object
const resolveLocationName = (val) => {
  if (val == null) return null;
  if (typeof val === 'string') return val.trim() || null;
  if (typeof val === 'object') {
    const nested = val.name || val.title || val.label || val.id || val.code;
    return nested ? String(nested).trim() : null;
  }
  return String(val).trim() || null;
};

const extractLocation = (asset) => {
  for (const field of LOCATION_FIELDS) {
    const name = resolveLocationName(asset[field]);
    if (name) return name;
  }
  return null;
};

// ── CLEAN PREMIUM MAP CARD ───────────────────────────────────────────
const MapCard = ({ locationCounts }) => {
  return (
    <Card sx={{
      mb: 4,
      borderRadius: 4,
      bgcolor: '#FFFFFF',
      border: '1px solid #EAECF0',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0px 4px 20px rgba(16,24,40,0.05)'
    }}>
      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EAECF0' }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#101828' }}>Network Overview</Typography>
          <Typography sx={{ fontSize: 13, color: '#667085' }}>Live locations of your packaging pool</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip size="small" label="Warehouse" sx={{ bgcolor: '#F4F3FF', color: '#5B5BD6', border: '1px solid #D9D6FE', fontWeight: 600 }} />
          <Chip size="small" label="Assembly" sx={{ bgcolor: '#EFF8FF', color: '#175CD3', border: '1px solid #B2DDFF', fontWeight: 600 }} />
          <Chip size="small" label="Customer" sx={{ bgcolor: '#ECFDF3', color: '#027A48', border: '1px solid #ABEFC6', fontWeight: 600 }} />
        </Box>
      </Box>
      <IndiaMap locationCounts={locationCounts} />
    </Card>
  );
};

// ── PREMIUM CUSTOM TOOLTIP ───────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ bgcolor: '#FFFFFF', p: 1.5, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.1)', border: '1px solid #EAECF0' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#667085', mb: 0.5 }}>{label}</Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>
          {payload[0].value} <span style={{ fontSize: 12, color: '#667085', fontWeight: 400 }}>{payload[0].name}</span>
        </Typography>
      </Box>
    );
  }
  return null;
};


const cardSx = {
  borderRadius: 4,
  boxShadow: '0px 2px 14px rgba(16,24,40,0.04)',
  border: '1px solid #EAECF0',
  transition: 'all 0.2s ease',
  '&:hover': { boxShadow: '0px 8px 24px rgba(16,24,40,0.08)' }
};

export default function Overview() {
  const [assets, setAssets] = useState([]);
  const [containers, setContainers] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [globalStats, setGlobalStats] = useState({ assets: 0, containers: 0, exceptions: 0 });
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getAssets(1, 1000),
      getContainers(),
      getExceptions(),
      getScanTrend()
    ])
      .then(([statsRes, assetsRes, containersRes, exceptionsRes, trendRes]) => {
        setGlobalStats(statsRes.data);
        const fetchedAssets = assetsRes.data.data || assetsRes.data;
        setAssets(fetchedAssets);
        setContainers(containersRes.data);
        setExceptions(exceptionsRes.data);
        setTrendData(trendRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // ✅ Calculate the total scans for the week dynamically
  const totalScans = trendData.reduce((sum, item) => sum + item.scans, 0);

  // ── REAL API COUNTS grouped by location ─────────────────────────
  const locationCounts = useMemo(() => {
    const counts = {};
    assets.forEach((asset) => {
      const loc = extractLocation(asset);
      if (!loc) return;
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return counts;
  }, [assets]);

  const openExceptions = exceptions.filter(e => e.status === 'open');
  const dispatched = containers.filter(c => c.status === 'dispatched');

  const statusCounts = { available: 0, in_use: 0, missing: 0, under_repair: 0 };
  assets.forEach(a => {
    if (statusCounts[a.status] !== undefined) statusCounts[a.status]++;
  });

  const statusData = [
    { name: 'Available', value: statusCounts.available, color: '#12B76A' },
    { name: 'In Use', value: statusCounts.in_use, color: '#2E90FA' },
    { name: 'Missing', value: statusCounts.missing, color: '#F04438' },
    { name: 'Repair', value: statusCounts.under_repair, color: '#F79009' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#101828', mb: 0.5 }}>Dashboard</Typography>
          <Typography variant="body1" sx={{ color: '#667085' }}>Welcome back. Here is a live snapshot of your packaging pool.</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<QrCodeScanner />}
          onClick={() => navigate('/scanner')}
          sx={{ borderRadius: 2, px: 3, py: 1, boxShadow: 'none' }}
        >
          Open Scanner
        </Button>
      </Box>



      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Total Components" value={globalStats.assets} trend="+12%" trendLabel="vs last week" icon={<Inventory2 />} color="#5B5BD6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Containers" value={globalStats.containers} trend="+4" trendLabel="this week" icon={<ViewInAr />} color="#12B76A" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Dispatched" value={dispatched.length} trend="+8%" trendLabel="in transit" icon={<CheckCircle />} color="#2E90FA" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Open Exceptions" value={openExceptions.length} trend={openExceptions.length > 0 ? `-${openExceptions.length}` : '+0'} trendLabel="need action" icon={<Warning />} color="#F04438" />
        </Grid>
      </Grid>

            {/* ── STACKED STATUS PROGRESS BAR ── */}
      <Box sx={{ mb: 4 }}>
        {/* Calculate total for percentages */}
        {(() => {
          const total = statusData.reduce((sum, item) => sum + item.value, 0);
          const getPercent = (val) => (total === 0 ? 0 : Math.round((val / total) * 100));

          return (
            <Box>
              {/* The Bar */}
              <Box
                sx={{
                  display: 'flex',
                  height: 10,
                  width: '100%',
                  borderRadius: 5,
                  overflow: 'hidden',
                  bgcolor: '#F2F4F7', // Fallback background for empty space
                  mb: 2,
                  gap: '2px', // Creates the tiny white gaps between segments
                }}
              >
                {statusData.map((item, index) => {
                  const percent = getPercent(item.value);
                  if (percent === 0) return null; // Don't render empty segments
                  return (
                    <Box
                      key={index}
                      sx={{
                        width: `${percent}%`,
                        bgcolor: item.color,
                        height: '100%',
                        transition: 'width 0.5s ease-in-out',
                      }}
                    />
                  );
                })}
              </Box>

              {/* Legend */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                {statusData.map((item, index) => {
                  const percent = getPercent(item.value);
                  return (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#667085' }}>
                        {item.name}: <span style={{ fontWeight: 700, color: '#101828' }}>{percent}%</span>
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })()}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
          <Card sx={{ width: '100%', ...cardSx }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Scan Activity</Typography>
                  <Typography variant="body2" sx={{ color: '#667085' }}>RFID reads over the last 7 days</Typography>
                </Box>
                {/* ✅ Dynamic Chip showing total scans */}
                <Chip
                  label={`${totalScans.toLocaleString()} Scans`}
                  size="small"
                  sx={{ bgcolor: '#F4F3FF', color: '#5B5BD6', fontWeight: 600, borderRadius: 1.5 }}
                />
              </Box>

              <Box sx={{ height: 280, minWidth: 0 }}>
                {/* ✅ Show a fallback if there is no data */}
                {trendData.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography sx={{ color: '#98A2B3' }}>No scan activity recorded yet.</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5B5BD6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#5B5BD6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#F2F4F7" vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} dy={10} />
                      {/* ✅ Added allowDecimals={false} */}
                      <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#EAECF0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="scans" name="Scans" stroke="#5B5BD6" strokeWidth={3} fill="url(#colorScans)" activeDot={{ r: 6, strokeWidth: 3, stroke: '#FFF' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
          <Card sx={{ width: '100%', height: '100%', ...cardSx }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Component Status</Typography>
              <Typography variant="body2" sx={{ color: '#667085', mb: 3 }}>Current distribution</Typography>
              <Box sx={{ height: 280, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid stroke="#F2F4F7" horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 500, fill: '#344054' }} axisLine={false} tickLine={false} width={80} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" name="Assets" radius={[0, 6, 6, 0]} barSize={24}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={cardSx}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Recent Exceptions</Typography>
              <Typography variant="body2" sx={{ color: '#667085' }}>Latest missing or incomplete scans requiring action</Typography>
            </Box>
            <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/exceptions')} sx={{ textTransform: 'none', fontWeight: 600 }}>
              View All
            </Button>
          </Box>

          <Divider />

          {exceptions.length > 0 ? (
            <Box>
              {exceptions.slice(0, 5).map(e => (
                <Box
                  key={e.id}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2.5, px: 3, py: 2,
                    borderBottom: '1px solid #F2F4F7',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: '#F9FAFB' },
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Avatar sx={{ width: 40, height: 40, bgcolor: e.status === 'open' ? '#FEF3F2' : '#ECFDF3', color: e.status === 'open' ? '#F04438' : '#12B76A' }}>
                    <Warning fontSize="small" />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>
                      {e.exception_id} <span style={{ color: '#98A2B3', fontWeight: 400 }}>·</span> {e.set_id}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#667085', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.reason}
                    </Typography>
                  </Box>
                  <Chip
                    label={e.status.toUpperCase()}
                    size="small"
                    sx={{ fontSize: 11, fontWeight: 600, borderRadius: 1.5, bgcolor: e.status === 'open' ? '#FEF3F2' : '#ECFDF3', color: e.status === 'open' ? '#B42318' : '#027A48', border: 'none' }}
                  />
                  <IconButton size="small">
                    <MoreHoriz />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: '#12B76A', mb: 1, opacity: 0.5 }} />
              <Typography variant="body1" sx={{ color: '#667085', fontWeight: 500 }}>
                No exceptions recorded yet — everything is running smoothly.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

            {/* India map — receives real counts from /assets */}
      <Box sx={{ mt: 4 }}>
      <MapCard locationCounts={locationCounts} />
      </Box>

    </Box>

    
  );
}