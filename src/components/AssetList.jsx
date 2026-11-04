import React, { useState } from 'react';
import {
  Card, CardContent, Typography, List, ListItem, ListItemText, Box, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Tooltip, Stack, TablePagination
} from '@mui/material';
import {
  Inventory2, Layers, DeleteOutlined, EditOutlined, Grid4x4, ViewStream
} from '@mui/icons-material';
import { deleteAsset } from '../services/api';
import lidImg from '../assets/lid.png';
import { useAuth } from '../context/AuthContext'; // <-- Import Auth

const TYPE_BADGE = {
  Pallet: { icon: <Inventory2 sx={{ fontSize: 14 }} />, color: '#F5B041' },
  Sleeve: { icon: <Layers sx={{ fontSize: 14 }} />,     color: '#2E90FA' },
  Lid:    { icon: <Box component="img" src={lidImg} alt="Lid" sx={{ width: 16, height: 16, objectFit: 'contain' }} />, color: '#5B5BD6' },
  Insert: { icon: <Grid4x4 sx={{ fontSize: 14 }} />, color: '#E67E22' },
  'Layer Pad': { icon: <ViewStream sx={{ fontSize: 14 }} />, color: '#8E44AD' },
};

const getTypeDetail = (asset) => {
  if (asset.type === 'Pallet' && asset.pallet_type) return asset.pallet_type;
  if (asset.type === 'Sleeve' && asset.sleeve_fold_type) return asset.sleeve_fold_type;
  if (asset.type === 'Lid'    && asset.lid_hinge_type)   return asset.lid_hinge_type;
  if (asset.type === 'Insert' && asset.insert_type)      return asset.insert_type;
  if (asset.type === 'Layer Pad' && asset.layer_pad_type) return asset.layer_pad_type;
  return null;
};

const AssetList = ({ assets, totalCount, page, rowsPerPage, onPageChange, onRowsPerPageChange, onRefresh, onEdit }) => {
  const { user } = useAuth(); // <-- Get user
  const canDelete = user?.role_id === 1; // Only Super Admin can delete
  const canEdit = user?.role_id === 1 || user?.role_id === 2; // Admin and Super Admin can edit

  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteAsset(pending.id);
      setPending(null);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0px 4px 20px rgba(16,24,40,0.05)' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Registered Assets ({totalCount})
          </Typography>

          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, pr: 1 }}>
            <List dense disablePadding>
              {assets.map((a) => {
                const badge = TYPE_BADGE[a.type] || TYPE_BADGE.Pallet;
                const detail = getTypeDetail(a);
                return (
                  <ListItem key={a.id} divider disableGutters sx={{ py: 1.25, px: 0, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: 1.5, mr: 1.5, mt: 0.25, bgcolor: `${badge.color}33`, color: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {badge.icon}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>{a.asset_id}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#667085', mt: 0.25 }}>{a.type} {detail ? `· ${detail}` : ''}</Typography>
                      {a.location_name && <Typography sx={{ fontSize: 11, color: '#667085' }}>📍 {a.location_name}</Typography>}
                      <Typography sx={{ fontSize: 11, color: '#667085' }}>Tag: {a.rfid_tag_id}</Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, alignItems: 'center' }}>
                      <Chip label={a.status} size="small" color={a.status === 'available' ? 'success' : a.status === 'in_use' ? 'info' : a.status === 'missing' ? 'error' : 'default'} sx={{ fontSize: 10, height: 20 }} />
                      
                      {/* ONLY SHOW EDIT IF ALLOWED */}
                      {canEdit && (
                        <Tooltip title="Edit asset">
                          <IconButton size="small" onClick={() => onEdit && onEdit(a)} sx={{ color: '#98A2B3', '&:hover': { color: '#5B5BD6' } }}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* ONLY SHOW DELETE IF ALLOWED */}
                      {canDelete && (
                        <Tooltip title="Delete asset">
                          <IconButton size="small" onClick={() => setPending(a)} sx={{ color: '#98A2B3', '&:hover': { color: '#F04438' } }}>
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </ListItem>
                );
              })}
              
              {assets.length === 0 && (
                <ListItem><ListItemText primary="No assets found" secondary="Use the form on the left to add one." /></ListItem>
              )}
            </List>
          </Box>

          <TablePagination
            component="div" count={totalCount} page={page}
            onPageChange={(e, newPage) => onPageChange(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { onRowsPerPageChange(parseInt(e.target.value, 10)); onPageChange(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            sx={{ borderTop: '1px solid #EAECF0', mt: 1, '.MuiTablePagination-toolbar': { minHeight: 40, px: 0 }, '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: 12 } }}
          />
        </CardContent>
      </Card>

      <Dialog open={!!pending} onClose={() => !busy && setPending(null)}>
        <DialogTitle>Delete asset?</DialogTitle>
        <DialogContent>
          <DialogContentText>This will permanently delete <strong>{pending?.asset_id}</strong> ({pending?.type}). This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} disabled={busy}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AssetList;