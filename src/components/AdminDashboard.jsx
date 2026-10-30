import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Box, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { getAssets, getExceptions, getContainers } from '../services/api';

const AdminDashboard = () => {
  const [tab, setTab] = useState(0);
  const [assets, setAssets] = useState([]);
  const [containers, setContainers] = useState([]);
  const [exceptions, setExceptions] = useState([]);

  const refresh = async () => {
    try {
      const [a, c, e] = await Promise.all([getAssets(), getContainers(), getExceptions()]);
      setAssets(a.data);
      setContainers(c.data);
      setExceptions(e.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { refresh(); }, []);

  const statusChip = (status) => {
    const color = status === 'available' || status === 'dispatched' ? 'success'
                : status === 'in_use' || status === 'assembled' ? 'info'
                : status === 'missing' || status === 'incomplete' ? 'error'
                : 'default';
    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <Card>  {/* was <Card sx={{ mt: 3 }}> */}
  <CardContent>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Database Viewer
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Live view of MySQL tables — refreshes when you switch tabs
        </Typography>
      </Box>
      <Chip label="Debug" size="small" color="warning" variant="outlined" />
    </Box>

    <Tabs value={tab} onChange={(e, v) => { setTab(v); refresh(); }} sx={{ mb: 2, borderBottom: '1px solid #EAECF0' }}>
      <Tab label={`Components (${assets.length})`} />
      <Tab label={`Containers (${containers.length})`} />
      <Tab label={`Exceptions (${exceptions.length})`} />
    </Tabs>

        {tab === 0 && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Asset ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>RFID Tag</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Set ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.id}</TableCell>
                    <TableCell>{a.asset_id}</TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>{a.rfid_tag_id}</TableCell>
                    <TableCell>{statusChip(a.status)}</TableCell>
                    <TableCell>{a.set_id || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Set ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Dispatch Time</TableCell>
                  <TableCell>Expected Return</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {containers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.set_id}</TableCell>
                    <TableCell>{statusChip(c.status)}</TableCell>
                    <TableCell>{c.dispatch_time ? new Date(c.dispatch_time).toLocaleString() : '—'}</TableCell>
                    <TableCell>{c.expected_return ? new Date(c.expected_return).toLocaleString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 2 && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Exception ID</TableCell>
                  <TableCell>Set ID</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exceptions.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.id}</TableCell>
                    <TableCell>{e.exception_id}</TableCell>
                    <TableCell>{e.set_id}</TableCell>
                    <TableCell>{e.reason}</TableCell>
                    <TableCell>{statusChip(e.status)}</TableCell>
                    <TableCell>{e.owner_role}</TableCell>
                    <TableCell>{new Date(e.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Last refreshed: {new Date().toLocaleTimeString()} — switch tabs to re-query.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;