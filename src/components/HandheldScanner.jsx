import React, { useState } from 'react';
import {
  Card, CardContent, Box, Typography, List, ListItem, ListItemText,
  Chip, Divider, Button, Alert
} from '@mui/material';
import { Inventory, CheckCircle, Warning, Sensors } from '@mui/icons-material';
import { dispatchScan } from '../services/api';

const HandheldScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (simulateMissing) => {
    setLoading(true);
    setScanResult(null);

    // In production, these tags come from the mounted UHF reader via WebSocket / TCP / MQTT
    const payload = {
      set_id: 'FLC-000046',
      scanned_rfid_tags: simulateMissing
        ? ['TAG_PAL_01', 'TAG_SLEEVE_01']
        : ['TAG_PAL_01', 'TAG_SLEEVE_01', 'TAG_LID_01'],
    };

    try {
      const res = await dispatchScan(payload);
      setScanResult(res.data);
    } catch (err) {
      setScanResult(err.response?.data || { success: false, message: 'Server error' });
    }
    setLoading(false);
  };

  return (
    <Card sx={{ border: '2px solid #0A1929' }}>
      {/* Header — states this is a fixed reader */}
      <Box
        sx={{
          backgroundColor: '#0A1929',
          color: 'white',
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sensors fontSize="small" />
          <Typography variant="subtitle2">RFID Reader · Dispatch Gate</Typography>
        </Box>
        <Typography variant="subtitle2">RDR-0188</Typography>
      </Box>

      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Inventory sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h6">FLC-000046</Typography>
            <Typography variant="body2" color="text.secondary">
              Destination: Customer plant
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Components detected in the last read:
        </Typography>
        <List dense>
          <ListItem>
            <Chip label="Pallet" size="small" sx={{ mr: 2, backgroundColor: '#F5B041', minWidth: 60 }} />
            <ListItemText primary="PAL-000046" />
            <Chip label="Read" color="success" size="small" variant="outlined" />
          </ListItem>
          <ListItem>
            <Chip label="Sleeve" size="small" sx={{ mr: 2, backgroundColor: '#A9CCE3', minWidth: 60 }} />
            <ListItemText primary="SLE-000046" />
            <Chip label="Read" color="success" size="small" variant="outlined" />
          </ListItem>
          <ListItem>
            <Chip label="Lid" size="small" sx={{ mr: 2, backgroundColor: '#5B5BD6', color: '#FFF', minWidth: 60 }} />
            <ListItemText primary="LID-000046" />
            <Chip label="Read" color="success" size="small" variant="outlined" />
          </ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary">
          Simulate reader triggers:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
          <Button variant="outlined" size="small" onClick={() => handleScan(false)} disabled={loading}>
            Simulate Full Read
          </Button>
          <Button variant="outlined" size="small" color="error" onClick={() => handleScan(true)} disabled={loading}>
            Simulate Missing Lid
          </Button>
        </Box>

        {scanResult && (
          <Alert
            severity={scanResult.success ? 'success' : 'error'}
            icon={scanResult.success ? <CheckCircle /> : <Warning />}
          >
            <Typography variant="subtitle2">{scanResult.message}</Typography>
            {!scanResult.success && (
              <Typography variant="caption">Exception: {scanResult.exception_id}</Typography>
            )}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Typography variant="caption">Reader · RDR-0188 · Dock 3</Typography>
          <Typography variant="subtitle2" fontWeight="bold">COMPLETE</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HandheldScanner;