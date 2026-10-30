import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Avatar, Button } from '@mui/material';
import {
    Inventory2, ViewInAr, Warning, CheckCircle, ArrowForward, QrCodeScanner
} from '@mui/icons-material';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar
} from 'recharts';
import KpiCard from '../components/KpiCard';
import { getAssets, getContainers, getExceptions } from '../services/api';
import { useNavigate } from 'react-router-dom';

const trendData = [
    { day: 'Mon', scans: 40 }, { day: 'Tue', scans: 65 }, { day: 'Wed', scans: 52 },
    { day: 'Thu', scans: 80 }, { day: 'Fri', scans: 95 }, { day: 'Sat', scans: 70 },
];
const statusData = [
    { name: 'Available', value: 12 },
    { name: 'In Use', value: 8 },
    { name: 'Missing', value: 2 },
];

export default function Overview() {
    const [assets, setAssets] = useState([]);
    const [containers, setContainers] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([getAssets(), getContainers(), getExceptions()])
            .then(([a, c, e]) => { setAssets(a.data); setContainers(c.data); setExceptions(e.data); })
            .catch(console.error);
    }, []);

    const openExceptions = exceptions.filter(e => e.status === 'open');
    const dispatched = containers.filter(c => c.status === 'dispatched');

    return (
        <Box>
            {/* Page header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h2" sx={{ mb: 0.5 }}>Overview</Typography>
                    <Typography variant="body2">Live snapshot of your packaging pool</Typography>
                </Box>
                <Button variant="contained" startIcon={<QrCodeScanner />} onClick={() => navigate('/scanner')}>
                    Open Scanner
                </Button>
            </Box>

            {/* KPI row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <KpiCard title="Total Components" value={assets.length} trend="+12%" trendLabel="vs last week" icon={<Inventory2 />} color="#5B5BD6" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <KpiCard title="Containers" value={containers.length} trend="+4" trendLabel="this week" icon={<ViewInAr />} color="#12B76A" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <KpiCard title="Dispatched" value={dispatched.length} trend="+8%" trendLabel="in transit" icon={<CheckCircle />} color="#2E90FA" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <KpiCard title="Open Exceptions" value={openExceptions.length} trend={openExceptions.length > 0 ? `-${openExceptions.length}` : '+0'} trendLabel="need action" icon={<Warning />} color="#F04438" />
                </Grid>
            </Grid>

            {/* Charts row */}
<Grid container spacing={2} sx={{ mb: 3 }}>
  <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
    <Card sx={{ width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4">Scan activity</Typography>
            <Typography variant="body2">RFID's reads over the last 6 days</Typography>
          </Box>
          <Chip label="This week" size="small" />
        </Box>
        <Box sx={{ height: 240, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B5BD6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#5B5BD6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F2F4F7" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="scans" stroke="#5B5BD6" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
    <Card sx={{ width: '100%', height: '100%' }}>
      <CardContent>
        <Typography variant="h4" sx={{ mb: 0.5 }}>Component status</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>Current distribution</Typography>
        <Box sx={{ height: 240, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="#F2F4F7" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#5B5BD6" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Grid>
</Grid>

            {/* Recent exceptions */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                            <Typography variant="h4">Recent exceptions</Typography>
                            <Typography variant="body2">Latest missing/incomplete scans</Typography>
                        </Box>
                        <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/exceptions')}>
                            View all
                        </Button>
                    </Box>
                    {exceptions.slice(0, 5).map(e => (
                        <Box
                            key={e.id}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 2,
                                py: 1.5, borderBottom: '1px solid #F2F4F7',
                                '&:last-child': { borderBottom: 'none' },
                            }}
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#FEF3F2', color: '#F04438' }}>
                                <Warning fontSize="small" />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{e.exception_id} · {e.set_id}</Typography>
                                <Typography sx={{ fontSize: 12, color: '#667085' }}>{e.reason}</Typography>
                            </Box>
                            <Chip label={e.status} size="small" color={e.status === 'open' ? 'error' : 'success'} variant="outlined" />
                        </Box>
                    ))}
                    {exceptions.length === 0 && (
                        <Typography variant="body2" sx={{ py: 3, textAlign: 'center' }}>
                            No exceptions recorded yet — everything is running smoothly.
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}