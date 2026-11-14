import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, Snackbar, InputAdornment, IconButton, Divider
} from '@mui/material';
import { 
  Add, Business, Person, Email, Phone, Place, Search, Clear, CheckCircle, ErrorOutlined, CorporateFare
} from '@mui/icons-material';
import { getClients, getLocations, createClient } from '../services/api';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', contact_person: '', email: '', phone: '', location_id: '' 
  });

  // Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientRes, locRes] = await Promise.all([getClients(), getLocations()]);
      const clientsData = Array.isArray(clientRes.data) ? clientRes.data : [];
      const locationsData = Array.isArray(locRes.data) ? locRes.data : [];
      setClients(clientsData);
      setLocations(locationsData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to load clients. Ensure backend is running and you are logged in as Super Admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError('Client Name is required.');
      return;
    }

    setSaving(true);
    setFormError('');
    
    try {
      await createClient(formData);
      setOpen(false);
      setToast({ open: true, message: 'Client added successfully!', severity: 'success' });
      setFormData({ name: '', contact_person: '', email: '', phone: '', location_id: '' });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add client.");
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      (client.name && client.name.toLowerCase().includes(query)) ||
      (client.contact_person && client.contact_person.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.location_name && client.location_name.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress size={32} thickness={4} /></Box>;
  }

  // Sleek, modern header style
  const headerCellStyle = { 
    color: '#F8FAFC', 
    backgroundColor: '#0F172A', 
    fontWeight: 600, 
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    py: 2,
    borderBottom: 'none'
  };

  return (
    <Box>
      {/* Header & Search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5, letterSpacing: '-0.5px' }}>
            Client Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#667085', fontSize: 14 }}>
            Manage customer profiles and their linked delivery locations.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><Search sx={{ color: '#98A2B3', fontSize: 20 }} /></InputAdornment>,
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}><Clear fontSize="small" sx={{ color: '#98A2B3' }} /></IconButton>
                  </InputAdornment>
                )
              }
            }}
            sx={{ 
              width: 300, 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2, 
                bgcolor: '#FFFFFF',
                '& fieldset': { borderColor: '#D0D5DD' },
                '&:hover fieldset': { borderColor: '#98A2B3' },
                '&.Mui-focused fieldset': { borderColor: '#0F172A', borderWidth: 1.5 }
              } 
            }}
          />
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => setOpen(true)}
            disableElevation
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600, 
              borderRadius: 2, 
              px: 3, 
              bgcolor: '#0F172A', 
              color: '#FFFFFF',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: '#1E293B', transform: 'translateY(-1px)' } 
            }}
          >
            Add Client
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" icon={<ErrorOutlined />} sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Data Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.04)', border: '1px solid #EAECF0', overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellStyle}>Client Name</TableCell>
              <TableCell sx={headerCellStyle}>Contact Person</TableCell>
              <TableCell sx={headerCellStyle}>Contact Info</TableCell>
              <TableCell sx={headerCellStyle}>Linked Location</TableCell>
              <TableCell sx={headerCellStyle} align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10, borderBottom: 'none' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '50%', mb: 2 }}>
                      <CorporateFare sx={{ fontSize: 40, color: '#98A2B3' }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 600, mb: 1 }}>
                      {searchQuery ? 'No clients found' : 'No clients yet'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#667085', maxWidth: 300, textAlign: 'center' }}>
                      {searchQuery 
                        ? `We couldn't find any results for "${searchQuery}". Try a different search term.` 
                        : 'Your customer directory is empty. Click "Add Client" to start building your network.'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow 
                  key={client.id} 
                  sx={{ 
                    '&:hover': { bgcolor: '#F9FAFB' },
                    '&:last-child td, &:last-child th': { borderBottom: 'none' }
                  }}
                >
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ p: 1, bgcolor: '#F4F3FF', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Business fontSize="small" sx={{ color: '#5B5BD6' }} />
                      </Box>
                      <Typography sx={{ fontWeight: 600, color: '#101828', fontSize: 14 }}>
                        {client.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#475467', fontSize: 14 }}>
                    {client.contact_person || <span style={{ color: '#98A2B3' }}>—</span>}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {client.email ? (
                        <Typography sx={{ fontSize: 13, color: '#475467', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Email sx={{ fontSize: 14, color: '#98A2B3' }} /> {client.email}
                        </Typography>
                      ) : null}
                      {client.phone ? (
                        <Typography sx={{ fontSize: 13, color: '#475467', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Phone sx={{ fontSize: 14, color: '#98A2B3' }} /> {client.phone}
                        </Typography>
                      ) : null}
                      {!client.email && !client.phone && <span style={{ color: '#98A2B3' }}>—</span>}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {client.location_name ? (
                      <Chip 
                        icon={<Place sx={{ fontSize: '14px !important', color: '#175CD3' }} />} 
                        label={client.location_name} 
                        size="small" 
                        sx={{ bgcolor: '#EFF8FF', color: '#175CD3', fontWeight: 600, border: '1px solid #B2DDFF', borderRadius: 1 }} 
                      />
                    ) : <span style={{ color: '#98A2B3' }}>—</span>}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={client.status.toUpperCase()} 
                      size="small" 
                      color={client.status === 'active' ? 'success' : 'default'} 
                      sx={{ fontWeight: 600, borderRadius: 1, fontSize: 11, height: 24 }} 
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Client Modal */}
      <Dialog 
        open={open} 
        onClose={() => !saving && setOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0px 20px 40px rgba(0,0,0,0.1)' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pt: 3, px: 3, color: '#0F172A' }}>
          Add New Client
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: '16px !important' }}>
          {formError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{formError}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              label="Client / Company Name" required fullWidth
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Business sx={{ color: '#98A2B3' }} /></InputAdornment> } }}
            />
            <TextField
              label="Contact Person" fullWidth
              value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Person sx={{ color: '#98A2B3' }} /></InputAdornment> } }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email Address" type="email" fullWidth
                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={{ color: '#98A2B3' }} /></InputAdornment> } }}
              />
              <TextField
                label="Phone Number" fullWidth
                value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Phone sx={{ color: '#98A2B3' }} /></InputAdornment> } }}
              />
            </Box>
            <TextField
              select label="Linked Delivery Location" fullWidth
              value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
              helperText="Link this client to a specific customer location."
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Place sx={{ color: '#98A2B3' }} /></InputAdornment> } }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>{loc.location_name}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setOpen(false)} 
            disabled={saving} 
            sx={{ color: '#475467', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#F2F4F7' } }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disableElevation
            disabled={saving || !formData.name}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
            sx={{ textTransform: 'none', fontWeight: 600, px: 3, bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' } }}
          >
            {saving ? 'Saving...' : 'Save Client'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Toast */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} sx={{ width: '100%', borderRadius: 2, fontWeight: 500, boxShadow: '0px 4px 20px rgba(0,0,0,0.1)' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}