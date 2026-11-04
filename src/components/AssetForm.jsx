import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, TextField, MenuItem, Select, InputLabel,
  FormControl, Button, Grid, Alert, Box, Divider, Chip, Stack, IconButton
} from '@mui/material';
import {
  Inventory2, Layers, Grid4x4, ViewStream, Place, WarningAmber, Lock, Save, Close, Visibility, EditOutlined
} from '@mui/icons-material';
import { createAsset, updateAsset, getLocations } from '../services/api';
import lidImg from '../assets/lid.png';

// ── Per-type configuration ──
const TYPE_META = {
  Pallet: {
    icon: <Inventory2 fontSize="small" />,
    color: '#F5B041',
    idPrefix: 'PAL',
    description: 'Upper component of the container (pallet base)',
    extraFields: [
      { name: 'pallet_type', label: 'Pallet Type', options: ['Rigid', 'Foldable', 'Stackable'] },
    ],
  },
  Sleeve: {
    icon: <Layers fontSize="small" />,
    color: '#2E90FA',
    idPrefix: 'SLE',
    description: 'Foldable side structure',
    extraFields: [
      { name: 'sleeve_fold_type', label: 'Fold Type', options: ['Z-Fold', 'C-Fold', 'Collapsible'] },
    ],
  },
  Lid: {
    icon: <Box component="img" src={lidImg} sx={{ width: 20, height: 20, objectFit: 'contain' }} />,
    color: '#5B5BD6',
    idPrefix: 'LID',
    description: 'Closing cover — tracked on its own',
    extraFields: [
      { name: 'lid_hinge_type', label: 'Hinge Type', options: ['Snap', 'Hinge', 'Loose'] },
    ],
  },
  Insert: {
    icon: <Grid4x4 fontSize="small" />,
    color: '#E67E22',
    idPrefix: 'INS',
    description: 'Internal divider for vehicle parts',
    extraFields: [
      { name: 'insert_type', label: 'Insert Type', options: ['Horizontal', 'Vertical'] },
    ],
  },
  'Layer Pad': {
    icon: <ViewStream fontSize="small" />,
    color: '#8E44AD',
    idPrefix: 'PAD',
    description: 'Protective padding layer',
    extraFields: [
      { name: 'layer_pad_type', label: 'Pad Type', options: ['Foam', 'Plastic', 'Fabric'] },
    ],
  },
};

const EMPTY_FORM = {
  asset_id: '',
  type: 'Pallet',
  rfid_tag_id: '',
  location_id: '',
  pallet_type: '',
  sleeve_fold_type: '',
  lid_hinge_type: '',
  insert_type: '',
  layer_pad_type: '',
  color: '',
  notes: '',
  status: 'available',
};

const AssetForm = ({ onRefresh, onTypeChange, editing, viewing, onCancelEdit, onEditClick }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [originalData, setOriginalData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(editing?.id);
  const isViewing = Boolean(viewing?.id);
  const meta = TYPE_META[formData.type] || TYPE_META.Pallet;

  const isDirty =
    isEdit &&
    originalData &&
    Object.keys(formData).some((k) => String(formData[k]) !== String(originalData[k]));

  // Load locations
  useEffect(() => {
    getLocations()
      .then((res) => {
        setLocations(res.data);
        if (res.data.length > 0 && !isEdit && !isViewing) {
          setFormData((prev) => ({ ...prev, location_id: res.data[0].id }));
        }
      })
      .catch((err) => {
        console.error('Failed to load locations', err);
        setError('Could not load locations. Is the backend running?');
      });
  }, [isEdit, isViewing]);

  // Hydrate form when entering Edit OR View mode
  useEffect(() => {
    if (isEdit) {
      const snapshot = {
        asset_id: editing.asset_id || '',
        type: editing.type || 'Pallet',
        rfid_tag_id: editing.rfid_tag_id || '',
        location_id: editing.current_location_id ?? '',
        pallet_type: editing.pallet_type || '',
        sleeve_fold_type: editing.sleeve_fold_type || '',
        lid_hinge_type: editing.lid_hinge_type || '',
        insert_type: editing.insert_type || '',
        layer_pad_type: editing.layer_pad_type || '',
        color: editing.color || '',
        notes: editing.notes || '',
        status: editing.status || 'available',
      };
      setFormData(snapshot);
      setOriginalData(snapshot);
      setError(null);
      setSuccess(false);
    } else if (isViewing) {
      const snapshot = {
        asset_id: viewing.asset_id || '',
        type: viewing.type || 'Pallet',
        rfid_tag_id: viewing.rfid_tag_id || '',
        location_id: viewing.current_location_id ?? '',
        pallet_type: viewing.pallet_type || '',
        sleeve_fold_type: viewing.sleeve_fold_type || '',
        lid_hinge_type: viewing.lid_hinge_type || '',
        insert_type: viewing.insert_type || '',
        layer_pad_type: viewing.layer_pad_type || '',
        color: viewing.color || '',
        notes: viewing.notes || '',
        status: viewing.status || 'available',
      };
      setFormData(snapshot);
      setOriginalData(null); // Not needed for view
      setError(null);
      setSuccess(false);
    } else {
      setOriginalData(null);
      setFormData(EMPTY_FORM); // Reset to empty when closing view/edit
    }
  }, [editing, viewing, isEdit, isViewing]);

  const handleTypeChange = (newType) => {
    const prefix = TYPE_META[newType].idPrefix;
    setFormData((prev) => ({
      ...prev,
      type: newType,
      asset_id:
        prev.asset_id && prev.asset_id.startsWith(TYPE_META[prev.type].idPrefix)
          ? `${prefix}${prev.asset_id.slice(TYPE_META[prev.type].idPrefix.length)}`
          : prev.asset_id,
      pallet_type: '',
      sleeve_fold_type: '',
      lid_hinge_type: '',
      insert_type: '',
      layer_pad_type: '',
    }));
    if (onTypeChange) onTypeChange(newType);
  };

  const resetForm = () => {
    const firstLoc = locations[0]?.id ?? '';
    setFormData({ ...EMPTY_FORM, location_id: firstLoc });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setError(null); setSuccess(false); setSaving(true);
    try {
      if (isEdit) {
        await updateAsset(editing.id, formData);
        setSuccess(true);
        setOriginalData(null);
        if (onCancelEdit) onCancelEdit();
      } else {
        await createAsset(formData);
        setSuccess(true);
        resetForm();
      }
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} asset`);
    } finally {
      setSaving(false);
    }
  };

  // ─── CARD STYLES (Amber for Edit, Blue for View, Default for Create) ───
  let cardSx = {
    border: '1px solid #EAECF0',
    bgcolor: '#FFFFFF',
  };

  if (isEdit) {
    cardSx = {
      border: '3px solid #F79009',
      bgcolor: '#FFFCF5',
      boxShadow: '0px 0px 0px 6px rgba(247,144,9,0.08), 0px 8px 24px rgba(16,24,40,0.08)',
    };
  } else if (isViewing) {
    cardSx = {
      border: '2px solid #175CD3',
      bgcolor: '#F0F9FF', // Very light blue
      boxShadow: '0px 4px 12px rgba(23,92,211,0.1)',
    };
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease', ...cardSx }}>
      <CardContent sx={{ flex: 1, p: { xs: 2, md: 3 } }}>

        {/* ═════════ EDIT-MODE CRITICAL BANNER ═════════ */}
        {isEdit && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: '#FEF0E1',
              border: '1px solid #FEC84B',
            }}
          >
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#F79009', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WarningAmber />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#B54708' }}>
                Critical edit: {editing.asset_id}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#B54708', mt: 0.25 }}>
                You are modifying an existing component. Changes are logged in the audit trail.
              </Typography>
            </Box>
            <Chip label="EDIT MODE" size="small" sx={{ bgcolor: '#F79009', color: '#FFF', fontWeight: 700, fontSize: 10, height: 22 }} />
          </Box>
        )}

        {/* ═════════ VIEW-MODE BANNER ═════════ */}
        {isViewing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, mb: 3, borderRadius: 2, bgcolor: '#E0F2FE', border: '1px solid #B2DDFF' }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#175CD3', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Visibility />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#026AA2' }}>
                Viewing Asset
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#026AA2', mt: 0.25 }}>
                You are viewing {viewing.asset_id}. Click "Close View" to return.
              </Typography>
            </Box>
            {/* NEW: Edit Button in View Mode */}
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<EditOutlined />} 
              onClick={onEditClick}
              sx={{ bgcolor: '#175CD3', textTransform: 'none', fontWeight: 600 }}
            >
              Edit
            </Button>
            <IconButton size="small" onClick={onCancelEdit} sx={{ color: '#026AA2' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Header (create mode only) */}
        {!isEdit && !isViewing && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Register Component
            </Typography>
            <Typography variant="body2">
              Each part gets its own identity
            </Typography>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {isEdit ? 'Changes saved successfully!' : 'Asset registered successfully!'}
          </Alert>
        )}

        {isEdit && isDirty && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }}>
            You have unsaved changes. Click <strong>Save Changes</strong> to apply them.
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Type — locked in edit & view */}
          <Grid size={12}>
            <FormControl fullWidth disabled={isEdit || isViewing}>
              <InputLabel>Component Type</InputLabel>
              <Select
                value={formData.type}
                label="Component Type"
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <MenuItem value="Pallet">Pallet</MenuItem>
                <MenuItem value="Sleeve">Sleeve</MenuItem>
                <MenuItem value="Lid">Lid</MenuItem>
                <MenuItem value="Insert">Insert</MenuItem>
                <MenuItem value="Layer Pad">Layer Pad</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Asset ID — locked in edit & view */}
          <Grid size={12}>
            <TextField
              fullWidth
              label="Asset ID"
              value={formData.asset_id}
              onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })} // <--- ADD THIS BACK
              disabled={isEdit || isViewing}
              helperText={isEdit || isViewing ? 'Asset ID is permanent.' : `Format: ${meta.idPrefix}-XXXXXX`}
            />
          </Grid>

          {/* RFID Tag — editable in create/edit, locked in view */}
          <Grid size={12}>
            <TextField
              fullWidth
              label="RFID Tag ID (EPC)"
              value={formData.rfid_tag_id}
              onChange={(e) => setFormData({ ...formData, rfid_tag_id: e.target.value })}
              disabled={isViewing}
              InputProps={{ readOnly: isViewing }}
            />
          </Grid>

          {/* Status — only in edit mode or view mode */}
          {(isEdit || isViewing) && (
            <Grid size={12}>
              <FormControl fullWidth disabled={isViewing}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="in_use">In Use</MenuItem>
                  <MenuItem value="missing">Missing</MenuItem>
                  <MenuItem value="under_repair">Under Repair</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Location — editable in create/edit, locked in view */}
          <Grid size={12}>
            <FormControl fullWidth disabled={locations.length === 0 || isViewing}>
              <InputLabel>Current Location</InputLabel>
              <Select
                value={formData.location_id}
                label="Current Location"
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Place sx={{ fontSize: 16, color: '#667085' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{loc.location_name}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#667085' }}>{loc.location_code}</Typography>
                      </Box>
                      <Chip size="small" label={loc.type} sx={{ height: 18, fontSize: 10 }} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Type-specific details */}
          <Grid size={12}>
            <Divider>
              <Typography variant="caption" sx={{ color: '#667085', px: 1 }}>
                {formData.type} Details
              </Typography>
            </Divider>
          </Grid>

          {meta.extraFields.map((field) => (
            <Grid size={{ xs: 12, sm: 6 }} key={field.name}>
              <FormControl fullWidth disabled={isViewing}>
                <InputLabel>{field.label}</InputLabel>
                <Select
                  label={field.label}
                  value={formData[field.name]}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                >
                  {field.options.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Color (optional)"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              disabled={isViewing}
              InputProps={{ readOnly: isViewing }}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isViewing}
              InputProps={{ readOnly: isViewing }}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid size={12}>
            {isEdit ? (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<Close />} onClick={onCancelEdit} disabled={saving} sx={{ flexShrink: 0, borderColor: '#EAECF0', color: '#475467' }}>
                  Cancel
                </Button>
                <Button variant="contained" fullWidth startIcon={<Save />} onClick={handleSubmit} disabled={saving || !isDirty} sx={{ py: 1.2, bgcolor: '#F79009', '&:hover': { bgcolor: '#DC6803' }, '&.Mui-disabled': { bgcolor: '#FEDF89', color: '#FFF' } }}>
                  {saving ? 'Saving…' : isDirty ? 'Save Changes' : 'No Changes to Save'}
                </Button>
              </Stack>
            ) : isViewing ? (
              <Button variant="outlined" fullWidth startIcon={<Close />} onClick={onCancelEdit} sx={{ py: 1.2, borderColor: '#175CD3', color: '#175CD3' }}>
                Close View
              </Button>
            ) : (
              <Button variant="contained" fullWidth onClick={handleSubmit} disabled={saving || !formData.asset_id || !formData.rfid_tag_id || !formData.location_id} sx={{ py: 1.2 }}>
                {saving ? 'Saving…' : `Register ${formData.type}`}
              </Button>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AssetForm;