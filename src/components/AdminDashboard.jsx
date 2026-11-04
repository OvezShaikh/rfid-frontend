import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Typography, Box, Tabs, Tab, Chip, CircularProgress, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import DataTable from './DataTable';
import { getAssets, getExceptions, getContainers, getAdminStats } from '../services/api';

const STATUS_COLOR = {
  available: 'success', dispatched: 'success', closed: 'success',
  in_use: 'info', assembled: 'info',
  missing: 'error', incomplete: 'error', open: 'error',
  under_repair: 'warning',
};

const StatusChip = ({ value }) => (
  <Chip label={value || '—'} color={STATUS_COLOR[value] || 'default'} size="small" sx={{ fontSize: 11, height: 22 }} />
);

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

const COMPONENT_COLUMNS = [
  { key: 'id',          label: 'ID',        width: 70, sortable: true, hideable: false },
  { key: 'asset_id',    label: 'Asset ID',  sortable: true, noWrap: true },
  { key: 'type',        label: 'Type',      sortable: true, filterable: true, filterOptions: ['Pallet', 'Sleeve', 'Lid', 'Insert', 'Layer Pad'] },
  { key: 'rfid_tag_id', label: 'RFID Tag',  noWrap: true },
  { key: 'status',      label: 'Status',    filterable: true, filterOptions: ['available', 'in_use', 'missing', 'under_repair'], render: (r) => <StatusChip value={r.status} /> },
  { key: 'set_id',      label: 'Set ID',    render: (r) => r.set_id || '—' },
  { key: 'location',    label: 'Location',  render: (r) => r.location_name || '—' },
  {
    key: 'updated_at',
    label: 'Updated',
    render: (r) =>
      r.updated_at
        ? new Date(r.updated_at).toLocaleString('en-GB', {
          day: '2-digit', month: '2-digit', year: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        })
        : '—',
  },
];

const CONTAINER_COLUMNS = [
  { key: 'id',              label: 'ID',     width: 70, sortable: true, hideable: false },
  { key: 'set_id',          label: 'Set ID', sortable: true, noWrap: true },
  { key: 'status',          label: 'Status', filterable: true, filterOptions: ['assembled', 'dispatched', 'received', 'returned', 'incomplete'], render: (r) => <StatusChip value={r.status} /> },
  { key: 'dispatch_time',   label: 'Dispatch', render: (r) => fmtDate(r.dispatch_time) },
  { key: 'expected_return', label: 'Return',   render: (r) => fmtDate(r.expected_return) },
];

const EXCEPTION_COLUMNS = [
  { key: 'id',           label: 'ID',           width: 70, sortable: true, hideable: false },
  { key: 'exception_id', label: 'Exception ID', noWrap: true },
  { key: 'set_id',       label: 'Set ID',       noWrap: true },
  { key: 'reason',       label: 'Reason',       render: (r) => r.reason?.slice(0, 60) + (r.reason?.length > 60 ? '…' : '') },
  { key: 'status',       label: 'Status',       filterable: true, filterOptions: ['open', 'closed'], render: (r) => <StatusChip value={r.status} /> },
  { key: 'owner_role',   label: 'Owner',        render: (r) => r.owner_role || '—' },
  { key: 'created_at',   label: 'Created',      render: (r) => fmtDate(r.created_at) },
];

const TabLabel = ({ name, count }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
    <span>{name}</span>
    {count !== undefined ? (
      <Chip label={count} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: 'rgba(0,0,0,0.06)', color: 'inherit', '& .MuiChip-label': { px: 0.75 } }} />
    ) : (
      <CircularProgress size={10} sx={{ color: 'inherit', opacity: 0.5 }} />
    )}
  </Box>
);

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [assets, setAssets] = useState([]);
  const [containers, setContainers] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  
  const [counts, setCounts] = useState({ assets: null, containers: null, exceptions: null });
  
  const loadedTabs = useRef(new Set());
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const statsRes = await getAdminStats();
      setCounts(statsRes.data);

      // FIX 1: Request a large batch (1000) and access res.data.data
      const res = await getAssets(1, 1000); 
      setAssets(res.data.data); 
      
      loadedTabs.current.add(0);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tabIndex, force = false) => {
    if (!force && loadedTabs.current.has(tabIndex)) return;

    setLoading(true);
    try {
      if (tabIndex === 0) {
        // FIX 2: Access res.data.data for pagination
        const res = await getAssets(1, 1000);
        setAssets(res.data.data);
      } else if (tabIndex === 1) {
        const res = await getContainers();
        setContainers(res.data);
      } else if (tabIndex === 2) {
        const res = await getExceptions();
        setExceptions(res.data);
      }
      loadedTabs.current.add(tabIndex);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(`Failed to load tab ${tabIndex}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    loadTabData(newValue);
  };

  const handleRefresh = () => {
    getAdminStats().then(r => setCounts(r.data));
    loadTabData(tab, true);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Database Viewer</Typography>
            <Typography variant="body2" color="text.secondary">Live view of MySQL tables</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button size="small" startIcon={<Refresh />} onClick={handleRefresh} sx={{ textTransform: 'none', fontSize: 12 }}>
              Refresh
            </Button>
            <Chip label="Debug" size="small" color="warning" variant="outlined" />
          </Box>
        </Box>

        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: '1px solid #EAECF0' }}>
          <Tab label={<TabLabel name="Components" count={counts.assets} />} />
          <Tab label={<TabLabel name="Containers" count={counts.containers} />} />
          <Tab label={<TabLabel name="Exceptions" count={counts.exceptions} />} />
        </Tabs>

        {tab === 0 && (
          <DataTable columns={COMPONENT_COLUMNS} rows={assets} loading={loading} exportFileName="components" emptyMessage="No components yet" />
        )}
        {tab === 1 && (
          <DataTable columns={CONTAINER_COLUMNS} rows={containers} loading={loading} exportFileName="containers" emptyMessage="No containers yet" />
        )}
        {tab === 2 && (
          <DataTable columns={EXCEPTION_COLUMNS} rows={exceptions} loading={loading} exportFileName="exceptions" emptyMessage="No exceptions" />
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}