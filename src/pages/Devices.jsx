import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, IconButton, Tooltip, Snackbar, InputAdornment
} from '@mui/material';
import {
  Add, Router, Sensors, QrCodeScanner, ContentCopy, CheckCircle, ErrorOutlined, Search, Clear
} from '@mui/icons-material';
import { getDevices, getLocations, createDevice } from '../services/api';

export default function Devices() {
  // Data State
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ device_name: '', device_type: 'gate', location_id: '' });
  const [formError, setFormError] = useState('');

  // Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [devRes, locRes] = await Promise.all([getDevices(), getLocations()]);
      setDevices(devRes.data);
      setLocations(locRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please ensure the backend is running and database is migrated.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({ device_name: '', device_type: 'gate', location_id: '' });
    setFormError('');
    setOpen(true);
  };

  const handleCloseModal = () => {
    if (!saving) setOpen(false);
  };

  const handleSave = async () => {
    if (!formData.device_name.trim() || !formData.location_id) {
      setFormError('Device Name and Location are required.');
      return;
    }

    setSaving(true);
    setFormError('');
    
    try {
      await createDevice(formData);
      setOpen(false);
      setToast({ open: true, message: 'Device registered successfully!', severity: 'success' });
      fetchData(); 
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to register device. Check connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = (deviceId) => {
    const url = `${window.location.origin}/scanner?device_id=${deviceId}`;
    navigator.clipboard.writeText(url);
    setToast({ open: true, message: 'Scanner link copied to clipboard!', severity: 'info' });
  };

  const getTypeIcon = (type) => {
    return type === 'gate' ? <Sensors fontSize="small" /> : <QrCodeScanner fontSize="small" />;
  };

  // Search Filter Logic
  const filteredDevices = devices.filter((device) => {
    const query = searchQuery.toLowerCase();
    return (
      device.id.toString().includes(query) ||
      (device.device_name && device.device_name.toLowerCase().includes(query)) ||
      (device.location_name && device.location_name.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#101828', mb: 0.5 }}>
            Hardware Devices
          </Typography>
          <Typography variant="body2" sx={{ color: '#667085' }}>
            Manage RFID gates and handheld scanners. Assign them to physical locations.
          </Typography>
        </Box>
        
        {/* Search Bar & Register Button */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by ID, name, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ 
              width: 300, 
              bgcolor: '#FFF',
              '& .MuiOutlinedInput-root': { borderRadius: 2 }
            }}
          />
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={handleOpenModal}
            sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none', borderRadius: 2, px: 3, py: 1, whiteSpace: 'nowrap' }}
          >
            Register Device
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" icon={<ErrorOutlined />} sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Devices Table Card */}
      <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(16,24,40,0.05)', border: '1px solid #EAECF0', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              {/* ✅ NEW DEVICE ID COLUMN */}
              <TableCell width="100px" sx={{ fontWeight: 600, color: '#475467' }}>Device ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Device Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Assigned Location</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#475467' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Router sx={{ fontSize: 48, color: '#D0D5DD', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#344054', fontWeight: 600, mb: 1 }}>
                    {searchQuery ? 'No matching devices found' : 'No devices registered'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#667085', mb: 3 }}>
                    {searchQuery 
                      ? `We couldn't find any devices matching "${searchQuery}"`
                      : 'You need to register a physical device to use the RFID scanner.'}
                  </Typography>
                  {!searchQuery && (
                    <Button variant="outlined" startIcon={<Add />} onClick={handleOpenModal} sx={{ textTransform: 'none' }}>
                      Add First Device
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices.map((device) => (
                <TableRow key={device.id} hover>
                  {/* ✅ DEVICE ID DISPLAYED HERE */}
                  <TableCell sx={{ fontWeight: 700, color: '#5B5BD6' }}>
                    {device.id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#101828' }}>
                    {device.device_name}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={getTypeIcon(device.device_type)}
                      label={device.device_type.toUpperCase()} 
                      size="small" 
                      sx={{ 
                        fontWeight: 600, 
                        bgcolor: device.device_type === 'gate' ? '#F4F3FF' : '#EFF8FF',
                        color: device.device_type === 'gate' ? '#5B5BD6' : '#175CD3',
                        border: '1px solid',
                        borderColor: device.device_type === 'gate' ? '#D9D6FE' : '#B2DDFF',
                        '& .MuiChip-icon': { color: 'inherit' }
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#475467' }}>
                    {device.location_name || `Location ID: ${device.location_id}`}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={device.status.toUpperCase()} 
                      size="small" 
                      color={device.status === 'active' ? 'success' : 'default'} 
                      sx={{ fontWeight: 600, borderRadius: 1 }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Copy unique scanner link for this device">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<ContentCopy fontSize="small" />}
                        onClick={() => handleCopyLink(device.id)}
                        sx={{ textTransform: 'none', color: '#475467', borderColor: '#D0D5DD' }}
                      >
                        Copy Link
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Register Device Modal */}
      <Dialog open={open} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Register New Hardware</DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          
          {formError && <Alert severity="error" sx={{ mb: 3 }}>{formError}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Device Name"
              placeholder="e.g. Supa Gate 1, Handheld 05"
              fullWidth
              value={formData.device_name}
              onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Router color="action" /></InputAdornment>
                ),
              }}
            />
            
            <TextField
              select
              label="Device Type"
              fullWidth
              value={formData.device_type}
              onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
            >
              <MenuItem value="gate">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Sensors fontSize="small" /> Fixed Gate (Bulk Auto)
                </Box>
              </MenuItem>
              <MenuItem value="handheld">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QrCodeScanner fontSize="small" /> Handheld Scanner (Manual)
                </Box>
              </MenuItem>
            </TextField>
            
            <TextField
              select
              label="Assign to Physical Location"
              fullWidth
              value={formData.location_id}
              onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
              helperText="This device will be permanently locked to this location for all scans."
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.location_name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={handleCloseModal} disabled={saving} sx={{ color: '#667085', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving || !formData.device_name || !formData.location_id}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
            sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none', px: 3 }}
          >
            {saving ? 'Registering...' : 'Register Device'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Toast */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setToast({ ...toast, open: false })} 
          severity={toast.severity} 
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}