import React, { useState } from 'react';
import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemText, Chip, IconButton, Tooltip, DialogContentText,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, DeleteOutlined, Inventory2, Layers, Grid4x4, ViewStream, WarningAmber 
} from '@mui/icons-material';
import DataTable from './DataTable';
import lidImg from '../assets/lid.png';
import { getContainerDetails, disassembleContainer } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ICON_MAP = {
  Pallet: <Inventory2 sx={{ color: '#F5B041' }} />,
  Sleeve: <Layers sx={{ color: '#2E90FA' }} />,
  Lid: <Box component="img" src={lidImg} sx={{ width: 20, height: 20 }} />,
  Insert: <Grid4x4 sx={{ color: '#E67E22' }} />,
  'Layer Pad': <ViewStream sx={{ color: '#8E44AD' }} />,
};

export default function ContainerTracker({ containers, onRefresh, loading }) {
  // Details Modal State
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentSet, setCurrentSet] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
const canDisassemble = user?.role_id === 1 || user?.role_id === 2;

  const handleViewDetails = async (setId) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await getContainerDetails(setId);
      setCurrentSet(res.data);
    } catch (err) {
      alert('Failed to load set details');
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await disassembleContainer(deleteTarget);
      setDeleteTarget(null); // Close dialog on success
      onRefresh(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to disassemble');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'set_id', label: 'Set ID', sortable: true, noWrap: true },
    { key: 'vehicle_type', label: 'Vehicle', render: (r) => <Chip label={r.vehicle_type} size="small" variant="outlined" /> },
    { 
      key: 'status', 
      label: 'Status', 
      render: (r) => (
        <Chip 
          label={r.status} 
          size="small" 
          color={r.status === 'assembled' ? 'info' : r.status === 'dispatched' ? 'success' : 'default'} 
        />
      ) 
    },
    { key: 'component_count', label: 'Components', align: 'center' },
    { key: 'created_at', label: 'Assembled On', render: (r) => new Date(r.created_at).toLocaleString() },
  ];

  return (
    <>
      <DataTable
        title="Active Sets"
        subtitle="Track assembled containers and the components inside them"
        columns={columns}
        rows={containers}
        loading={loading}
        exportFileName="containers"
        rowActions={(row) => (
          <>
            <Tooltip title="View Components">
              <IconButton size="small" onClick={() => handleViewDetails(row.set_id)}>
                <Visibility fontSize="small" sx={{ color: '#5B5BD6' }} />
              </IconButton>
            </Tooltip>
            {row.status === 'assembled' && (
              <Tooltip title="Disassemble Set">
                <IconButton size="small" onClick={() => setDeleteTarget(row.set_id)}>
                  <DeleteOutlined fontSize="small" sx={{ color: '#F04438' }} />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      />

      {/* ── 1. VIEW DETAILS MODAL ── */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Set Details: {currentSet?.set_id}
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : currentSet ? (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Vehicle: {currentSet.vehicle_type} | Status: {currentSet.status.toUpperCase()}
              </Typography>
              
              <Typography variant="h6" sx={{ fontSize: 15, mb: 1 }}>Tracked Components</Typography>
              <List dense>
                {currentSet.components.map((comp) => (
                  <ListItem key={comp.asset_id} sx={{ bgcolor: '#F9FAFB', mb: 1, borderRadius: 1 }}>
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      {ICON_MAP[comp.type]}
                    </Box>
                    <ListItemText 
                      primary={<Typography sx={{ fontWeight: 600 }}>{comp.asset_id}</Typography>}
                      secondary={`Type: ${comp.type} | Tag: ${comp.rfid_tag_id}`}
                    />
                    <Chip label={comp.status} size="small" color="info" />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── 2. DELETE CONFIRMATION MODAL ── */}
      <Dialog 
        open={!!deleteTarget} 
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#B42318', fontWeight: 700 }}>
          <WarningAmber /> Disassemble Set?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#344054' }}>
            Are you sure you want to disassemble set <strong>{deleteTarget}</strong>?
            <br /><br />
            This will unlock all linked components (Pallet, Sleeve, Lid, etc.) and set their status back to <strong>available</strong>. The set ID will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setDeleteTarget(null)} 
            disabled={deleting}
            sx={{ textTransform: 'none', color: '#475467', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained" 
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlined />}
            sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
          >
            {deleting ? 'Disassembling...' : 'Yes, Disassemble'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}