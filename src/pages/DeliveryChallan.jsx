import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Select, InputLabel, FormControl, Table, TableBody, TableCell, TableHead,
  TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import { Add, Print, LocalShipping } from '@mui/icons-material';
import { getAllContainers, getLocations, createChallan, getAllChallans, getChallanById } from '../services/api';
import ChallanPrint from '../components/ChallanPrint';

export default function DeliveryChallan() {
  const [challans, setChallans] = useState([]);
  const [locations, setLocations] = useState([]);
  const [availableSets, setAvailableSets] = useState([]);
  
  const [formData, setFormData] = useState({
    from_location_id: 2, // Minda Plant
    to_location_id: 5,   // Vitthlapur
    lr_no: '', vehicle_no: '', driver_name: '', driver_mob: '', selectedSets: []
  });

  const [printData, setPrintData] = useState(null);

  useEffect(() => {
    fetchChallans();
    getLocations().then(res => setLocations(res.data));
    getAllContainers().then(res => {
      // Only sets that are assembled can be dispatched
      setAvailableSets(res.data.filter(c => c.status === 'assembled'));
    });
  }, []);

  const fetchChallans = () => {
    getAllChallans().then(res => setChallans(res.data));
  };

  const handleCreate = async () => {
    if (formData.selectedSets.length === 0) return alert("Select at least one set.");
    
    try {
      const payload = {
        ...formData,
        set_ids: formData.selectedSets
      };
      const res = await createChallan(payload);
      alert(`Challan Generated: ${res.data.challan_no}`);
      fetchChallans();
      setFormData({ ...formData, selectedSets: [] });
    } catch (err) {
      alert("Failed to create challan.");
    }
  };

  const handleViewPrint = async (id) => {
    const res = await getChallanById(id);
    setPrintData(res.data);
  };

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 3 }}>Delivery Challans</Typography>

      {/* Create Form */}
          <Card sx={{ mb: 4 }}>
              <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Create New Bulk Dispatch</Typography>
                  <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                          <FormControl fullWidth size="small">
                              <InputLabel>From Location</InputLabel>
                              <Select value={formData.from_location_id} label="From Location" onChange={(e) => setFormData({ ...formData, from_location_id: e.target.value })}>
                                  {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.location_name}</MenuItem>)}
                              </Select>
                          </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                          <FormControl fullWidth size="small">
                              <InputLabel>To Location</InputLabel>
                              <Select value={formData.to_location_id} label="To Location" onChange={(e) => setFormData({ ...formData, to_location_id: e.target.value })}>
                                  {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.location_name}</MenuItem>)}
                              </Select>
                          </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={2}><TextField fullWidth size="small" label="Vehicle No" value={formData.vehicle_no} onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value })} /></Grid>
                      <Grid item xs={12} sm={2}><TextField fullWidth size="small" label="Driver Name" value={formData.driver_name} onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })} /></Grid>
                      <Grid item xs={12} sm={2}><TextField fullWidth size="small" label="LR No" value={formData.lr_no} onChange={(e) => setFormData({ ...formData, lr_no: e.target.value })} /></Grid>

                      <Grid item xs={12}>
                          <FormControl fullWidth size="small" sx={{ minWidth: 300 }}>
                              <InputLabel>Select Assembled Sets to Dispatch</InputLabel>
                              <Select
                                  multiple
                                  value={formData.selectedSets}
                                  label="Select Assembled Sets to Dispatch"
                                  onChange={(e) => setFormData({ ...formData, selectedSets: e.target.value })}
                                  // THE FIX: renderValue handles how selected items appear, preventing layout breaks
                                  renderValue={(selected) => (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {selected.map((value) => (
                                              <Chip key={value} label={value} size="small" />
                                          ))}
                                      </Box>
                                  )}
                                  // THE FIX: Limit the dropdown menu height
                                  MenuProps={{
                                      PaperProps: {
                                          style: { maxHeight: 250, width: 300 },
                                      },
                                  }}
                              >
                                  {/* Added fallback (availableSets || []) to prevent crashes if it's null */}
                                  {(availableSets || []).length === 0 && (
                                      <MenuItem disabled value="">
                                          <em>No assembled sets available</em>
                                      </MenuItem>
                                  )}
                                  {(availableSets || []).map(s => (
                                      <MenuItem key={s.set_id} value={s.set_id}>
                                          {s.set_id} ({s.vehicle_type})
                                      </MenuItem>
                                  ))}
                              </Select>
                          </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} sx={{ bgcolor: '#102A43', mt: 1 }}>
                              Generate Challan
                          </Button>
                      </Grid>
                  </Grid>
              </CardContent>
          </Card>

      {/* Past Challans Table */}
      <Card>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell>Challan No</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>From → To</TableCell>
              <TableCell>Sets</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {challans.map(c => (
              <TableRow key={c.id}>
                <TableCell sx={{ fontWeight: 600 }}>{c.challan_no}</TableCell>
                <TableCell>{new Date(c.challan_date).toLocaleDateString()}</TableCell>
                <TableCell>{c.from_name} → {c.to_name_loc}</TableCell>
                <TableCell>{c.total_sets} Sets</TableCell>
                <TableCell><Chip label={c.status} size="small" color="success" /></TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleViewPrint(c.id)}><Print /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Print Dialog */}
      <Dialog open={!!printData} onClose={() => setPrintData(null)} maxWidth="md" fullWidth>
        <DialogTitle>Print Preview</DialogTitle>
        <DialogContent dividers>
          {printData && <ChallanPrint data={printData} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintData(null)}>Close</Button>
          <Button variant="contained" onClick={() => window.print()}>Print</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}