import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Box, Typography, List, ListItem, ListItemText,
  Chip, Divider, Button, Alert, CircularProgress, Autocomplete,
  TextField, Grid, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  CheckCircle, Warning, Sensors, LocalShipping, Receipt,
  MoveToInbox, Warehouse, QrCodeScanner, Person,
  Outbox, Inbox, AssignmentReturn
} from '@mui/icons-material';
import {
  getAllContainers, getAssets, getContainerDetails,
  unifiedScan, bulkReceive, bulkReturn
} from '../services/api';

export default function RFIDReader() {
  const [action, setAction] = useState('dispatch'); // 'dispatch', 'receive', 'return'
  const [scanMode, setScanMode] = useState('gate'); // 'gate' (bulk sets) or 'handheld' (loose parts)

  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const [availableSets, setAvailableSets] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [scannedItems, setScannedItems] = useState([]);

  const [vehicleNo, setVehicleNo] = useState('MH-14-AB-1234');
  const [driverName, setDriverName] = useState('Ramesh Kumar');

  // Load data based on action & mode
  useEffect(() => {
    setScannedItems([]);
    setScanResult(null);

    if (scanMode === 'gate') {
      getAllContainers().then(res => {
        const allSets = res.data;
        if (action === 'dispatch') setAvailableSets(allSets.filter(c => c.status === 'assembled'));
        if (action === 'receive') setAvailableSets(allSets.filter(c => c.status === 'dispatched'));
        if (action === 'return') setAvailableSets(allSets.filter(c => c.status === 'received' || c.status === 'dispatched'));
      });
    } else {
      // Handheld mode: Fetch loose assets
      getAssets(1, 1000).then(res => {
        const assets = res.data.data || res.data;
        setAvailableAssets(assets.filter(a => a.status === 'available' || a.status === 'in_use'));
      });
    }
  }, [action, scanMode]);

  const handleAddItem = (item) => {
    if (!item) return;
    const id = scanMode === 'gate' ? item.set_id : item.asset_id;

    if (!scannedItems.find(i => i.id === id)) {
      setScannedItems([...scannedItems, { id, type: scanMode, data: item }]);
    }
  };

  const handleRemoveItem = (id) => {
    setScannedItems(scannedItems.filter(i => i.id !== id));
  };

  const handleProcess = async () => {
    if (scannedItems.length === 0) return;
    setLoading(true);
    setScanResult(null);

    try {
      let allTags = [];

      // Gather tags based on what's in the cart
      for (const item of scannedItems) {
        if (item.type === 'gate') {
          const res = await getContainerDetails(item.id);
          res.data.components.forEach(c => allTags.push(c.rfid_tag_id));
        } else {
          allTags.push(item.data.rfid_tag_id);
        }
      }

      let res;
      if (action === 'dispatch') {
        res = await unifiedScan({
          scanned_rfid_tags: allTags,
          destination_location_id: 5, // Vitthlapur
          vehicle_no: scanMode === 'gate' ? vehicleNo : 'NA',
          driver_name: scanMode === 'gate' ? driverName : 'NA'
        });
      } else if (action === 'receive') {
        if (scanMode === 'gate') {
          res = await bulkReceive({ scanned_rfid_tags: allTags });
        } else {
          res = await unifiedScan({ scanned_rfid_tags: allTags, destination_location_id: 5, vehicle_no: 'NA', driver_name: 'NA' });
        }
      } else if (action === 'return') {
        if (scanMode === 'gate') {
          res = await bulkReturn({ scanned_rfid_tags: allTags, return_location_id: 1 });
        } else {
          res = await unifiedScan({ scanned_rfid_tags: allTags, destination_location_id: 1, vehicle_no: 'NA', driver_name: 'NA' });
        }
      }

      setScanResult({ success: true, message: res.data.message, challan_no: res.data.challan_no });
      setScannedItems([]);

      // Refresh the lists
      if (scanMode === 'gate') {
        const refreshed = await getAllContainers();
        if (action === 'dispatch') setAvailableSets(refreshed.data.filter(c => c.status === 'assembled'));
        if (action === 'receive') setAvailableSets(refreshed.data.filter(c => c.status === 'dispatched'));
        if (action === 'return') setAvailableSets(refreshed.data.filter(c => c.status === 'received' || c.status === 'dispatched'));
      } else {
        getAssets(1, 1000).then(res => {
          const assets = res.data.data || res.data;
          setAvailableAssets(assets.filter(a => a.status === 'available' || a.status === 'in_use'));
        });
      }

    } catch (err) {
      setScanResult({ success: false, message: err.response?.data?.error || 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = () => {
    if (action === 'dispatch') return '#027A48';
    if (action === 'receive') return '#175CD3';
    return '#B54708'; // Return
  };

  return (
    <Card sx={{ border: '2px solid #0A1929', height: '100%' }}>
      <Box sx={{ backgroundColor: '#0A1929', color: 'white', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {scanMode === 'gate' ? <Sensors fontSize="small" /> : <QrCodeScanner fontSize="small" />}
          {scanMode === 'gate' ? 'Automated Fixed Gate' : 'Manual Handheld Scanner'}
        </Typography>
        <Chip label={scanMode === 'gate' ? 'GATE MODE' : 'HANDHELD'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
      </Box>

      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 54px)' }}>

        {/* 1. DEVICE TOGGLE */}
        <ToggleButtonGroup
          color="secondary"
          value={scanMode}
          exclusive
          onChange={(e, newMode) => { if (newMode) setScanMode(newMode); }}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="gate" sx={{ textTransform: 'none' }}>
            <Sensors sx={{ mr: 1, fontSize: 18 }} /> Fixed Gate (Bulk Auto)
          </ToggleButton>
          <ToggleButton value="handheld" sx={{ textTransform: 'none' }}>
            <Person sx={{ mr: 1, fontSize: 18 }} /> Handheld (Manual User)
          </ToggleButton>
        </ToggleButtonGroup>


        {/* 2. ACTION TOGGLE */}
        <ToggleButtonGroup
          color="primary"
          value={action}
          exclusive
          onChange={(e, newAction) => { if (newAction) setAction(newAction); }}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="dispatch" sx={{ textTransform: 'none', fontWeight: 600, py: 1 }}>
            {scanMode === 'gate'
              ? <LocalShipping sx={{ mr: 1, fontSize: 20 }} />
              : <Outbox sx={{ mr: 1, fontSize: 20 }} />}
            Dispatch
          </ToggleButton>

          <ToggleButton value="receive" sx={{ textTransform: 'none', fontWeight: 600, py: 1 }}>
            {scanMode === 'gate'
              ? <MoveToInbox sx={{ mr: 1, fontSize: 20 }} />
              : <MoveToInbox sx={{ mr: 1, fontSize: 20 }} />}
            Receive
          </ToggleButton>

          <ToggleButton value="return" sx={{ textTransform: 'none', fontWeight: 600, py: 1 }}>
            {scanMode === 'gate'
              ? <Warehouse sx={{ mr: 1, fontSize: 20 }} />
              : <AssignmentReturn sx={{ mr: 1, fontSize: 20 }} />}
            Return
          </ToggleButton>
        </ToggleButtonGroup>



        {/* Trip Details (Only for Gate + Dispatch) */}
        {action === 'dispatch' && scanMode === 'gate' && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}><TextField fullWidth size="small" label="Vehicle No." value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Driver Name" value={driverName} onChange={(e) => setDriverName(e.target.value)} /></Grid>
          </Grid>
        )}

        {/* Add Item to Cart */}
        <Box sx={{ mb: 3 }}>
          {scanMode === 'gate' ? (
            <Autocomplete
              options={availableSets.filter(s => !scannedItems.find(i => i.id === s.set_id))}
              getOptionLabel={(option) => `${option.set_id} (${option.vehicle_type})`}
              onChange={(e, val) => handleAddItem(val)}
              value={null}
              renderInput={(params) => <TextField {...params} label="Simulate Gate Reading Set" size="small" />}
            />
          ) : (
            <Autocomplete
              options={availableAssets.filter(a => !scannedItems.find(i => i.id === a.asset_id))}
              getOptionLabel={(option) => `${option.asset_id} (${option.type})`}
              onChange={(e, val) => handleAddItem(val)}
              value={null}
              renderInput={(params) => <TextField {...params} label="Simulate Handheld Scanning Part" size="small" />}
            />
          )}
        </Box>

        {/* Virtual Cart */}
        {scannedItems.length > 0 && (
          <Box sx={{ flex: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                Scanned Items ({scannedItems.length})
              </Typography>
              {/* Add a Clear All button for large loads */}
              <Button size="small" color="error" onClick={() => setScannedItems([])} sx={{ fontSize: 11, textTransform: 'none', py: 0 }}>
                Clear All
              </Button>
            </Box>

            <Box sx={{ maxHeight: 350, overflow: 'auto', pr: 1 }}> {/* Increased height */}
              <List dense>
                {scannedItems.map(item => (
                  <ListItem key={item.id} sx={{ bgcolor: '#F9FAFB', mb: 1, borderRadius: 1 }}
                    secondaryAction={<Button size="small" color="error" onClick={() => handleRemoveItem(item.id)}>Remove</Button>}
                  >
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: 600, fontSize: 13 }}>{item.id}</Typography>}
                      secondary={item.type === 'gate' ? `Set (${item.data.vehicle_type})` : `Loose (${item.data.type})`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Receipt />}
            onClick={handleProcess}
            disabled={loading || scannedItems.length === 0}
            sx={{ py: 1.2, bgcolor: getActionColor(), '&:hover': { filter: 'brightness(0.9)' }, textTransform: 'none', fontWeight: 600 }}
          >
            {loading ? 'Processing...' : `Confirm ${scanMode === 'gate' ? 'Automated Bulk ' : 'Manual '}${action.charAt(0).toUpperCase() + action.slice(1)}`}
          </Button>
        </Box>

        {scanResult && (
          <Alert severity={scanResult.success ? 'success' : 'error'} sx={{ mt: 2 }} icon={scanResult.success ? <CheckCircle /> : <Warning />}>
            <Typography variant="subtitle2">{scanResult.message}</Typography>
            {scanResult.success && scanResult.challan_no && (
              <Typography variant="caption" display="block">DC: <strong>{scanResult.challan_no}</strong></Typography>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}