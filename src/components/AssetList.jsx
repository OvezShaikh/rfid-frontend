import React, { useState } from 'react';
import {
  Card, CardContent, Typography, List, ListItem, ListItemText, Box, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Tooltip, Stack
} from '@mui/material';
import {
  Inventory2, Layers, DensityMedium, DeleteOutlined, EditOutlined
} from '@mui/icons-material';
import { deleteAsset } from '../services/api';
import lidImg from '../assets/lid.png';

const TYPE_BADGE = {
  Pallet: { icon: <Inventory2 sx={{ fontSize: 14 }} />, color: '#F5B041' },
  Sleeve: { icon: <Layers sx={{ fontSize: 14 }} />,     color: '#2E90FA' },
  Lid:    {
    icon: <Box component="img" src={lidImg} alt="Lid"
      sx={{ width: 16, height: 16, objectFit: 'contain' }} />,
    color: '#5B5BD6',
  },
};

const getTypeDetail = (asset) => {
  if (asset.type === 'Pallet' && asset.pallet_type) return asset.pallet_type;
  if (asset.type === 'Sleeve' && asset.sleeve_fold_type) return asset.sleeve_fold_type;
  if (asset.type === 'Lid'    && asset.lid_hinge_type)   return asset.lid_hinge_type;
  return null;
};

const AssetList = ({ assets, onRefresh, onEdit }) => {
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
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="h6">Registered Assets ({assets.length})</Typography>

          <Box sx={{ maxHeight: 480, overflow: 'auto', mt: 1 }}>
            <List dense>
              {assets.map((a) => {
                const badge = TYPE_BADGE[a.type] || TYPE_BADGE.Pallet;
                const detail = getTypeDetail(a);
                return (
                  <ListItem
                    key={a.id}
                    divider
                    disableGutters
                    sx={{ py: 1.25, px: 0, alignItems: 'flex-start' }} // Align to top if text wraps
                  >
                    {/* Left: Icon */}
                    <Box sx={{
                      width: 28, height: 28, borderRadius: 1.5, mr: 1.5, mt: 0.25,
                      bgcolor: `${badge.color}33`, color: badge.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {badge.icon}
                    </Box>

                    {/* Middle: Text Content (grows to fill space) */}
                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
                        {a.asset_id}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#667085', lineHeight: 1.4, mt: 0.25 }}>
                        {a.type}
                        {detail ? ` · ${detail}` : ''}
                        {a.location_name ? ` · 📍 ${a.location_name}` : ''}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#667085' }}>
                        Tag: {a.rfid_tag_id}
                      </Typography>
                    </Box>

                    {/* Right: Actions (Fixed width, never overlaps) */}
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                      <Chip
                        label={a.status}
                        size="small"
                        color={
                          a.status === 'available' ? 'success' :
                          a.status === 'in_use'    ? 'info'    :
                          a.status === 'missing'   ? 'error'   : 'default'
                        }
                        sx={{ fontSize: 10, height: 20 }}
                      />
                      <Tooltip title="Edit asset">
                        <IconButton
                          size="small"
                          onClick={() => onEdit && onEdit(a)}
                          sx={{ color: '#98A2B3', '&:hover': { color: '#5B5BD6' } }}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete asset">
                        <IconButton
                          size="small"
                          onClick={() => setPending(a)}
                          sx={{ color: '#98A2B3', '&:hover': { color: '#F04438' } }}
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItem>
                );
              })}
              {assets.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No assets registered yet"
                    secondary="Use the form on the left to add your first Pallet, Sleeve, or Lid."
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={!!pending} onClose={() => !busy && setPending(null)}>
        <DialogTitle>Delete asset?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete <strong>{pending?.asset_id}</strong> ({pending?.type}).
            This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} disabled={busy}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={busy}>
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AssetList;