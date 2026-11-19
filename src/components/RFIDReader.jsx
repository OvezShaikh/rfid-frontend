import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card, CardContent, Box, Typography, List, ListItem, ListItemText,
  Chip, Divider, Button, Alert, CircularProgress, Autocomplete,
  TextField, Grid, ToggleButton, ToggleButtonGroup, LinearProgress,
  IconButton
} from '@mui/material';
import { queueScan } from '../services/offlineDB';
import {
  CheckCircle, Warning, Sensors, LocalShipping, Receipt,
  MoveToInbox, Warehouse, QrCodeScanner, Person,
  Outbox, AssignmentReturn, WifiOff, Build, Wifi,
  Delete
} from '@mui/icons-material';
import {
  getAllContainers, getAssets, getContainerDetails,
  unifiedScan, bulkReceive, bulkReturn, getDeviceById,
  getDevices 
} from '../services/api';

const LAYER_PADS_PER = { Motorcycle: 2, Scooter: 3 };

// Inserts decide the vehicle: 2 = Motorcycle, 3 = Scooter
const splitInserts = (n) => {
  const sizes = [];
  while (n >= 2) {
    if (n % 2 === 0) { sizes.push(2); n -= 2; }
    else             { sizes.push(3); n -= 3; }
  }
  return sizes;
};

export default function RFIDReader() {
  const [searchParams] = useSearchParams();
  const deviceId = searchParams.get('device_id');

  const [action, setAction] = useState('dispatch'); 
  const [scanMode, setScanMode] = useState('gate'); 

  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const [availableSets, setAvailableSets] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [scannedItems, setScannedItems] = useState([]);

  const [vehicleNo, setVehicleNo] = useState('MH-14-AB-1234');
  const [driverName, setDriverName] = useState('Ramesh Kumar');
  const [deviceInfo, setDeviceInfo] = useState(null);

  // ✅ 1. Device Info with AUTO-DETECTION + Offline Cache
  useEffect(() => {
    const loadDevice = async () => {
      let activeDeviceId = deviceId;

      if (!activeDeviceId) {
        activeDeviceId = localStorage.getItem('last_device_id');
        if (activeDeviceId) {
          console.log(`🔄 Auto-restored device from cache: ${activeDeviceId}`);
        }
      }

      if (activeDeviceId) {
        const cached = localStorage.getItem(`device_${activeDeviceId}`);
        if (cached) setDeviceInfo(JSON.parse(cached));

        try {
          const res = await getDeviceById(activeDeviceId);
          setDeviceInfo(res.data);
          localStorage.setItem(`device_${activeDeviceId}`, JSON.stringify(res.data));
          localStorage.setItem('last_device_id', activeDeviceId);
        } catch (err) {
          console.warn("Cached device failed, trying auto-detect...");
        }
      }

      if (!activeDeviceId || !localStorage.getItem(`device_${activeDeviceId}`)) {
        try {
          const res = await getDevices();
          const activeDevice = res.data.find(d => d.status === 'active');
          
          if (activeDevice) {
            console.log(`🤖 Auto-detected device: ${activeDevice.device_name} (ID: ${activeDevice.id})`);
            setDeviceInfo(activeDevice);
            localStorage.setItem(`device_${activeDevice.id}`, JSON.stringify(activeDevice));
            localStorage.setItem('last_device_id', activeDevice.id);
          } else {
            alert('No active devices found. Please register a device first from the Devices page.');
          }
        } catch (err) {
          console.error("Failed to auto-detect device:", err);
          alert('Could not connect to load device info. Please check your connection.');
        }
      }
    };

    loadDevice();
  }, [deviceId]);

  // ✅ 2. Lists with Offline Cache
  useEffect(() => {
    setScanResult(null);

    const cachedSets = localStorage.getItem('cached_sets');
    if (cachedSets) setAvailableSets(JSON.parse(cachedSets));

    getAllContainers().then(res => {
      const allSets = res.data;
      let filtered = [];
      if (action === 'dispatch') filtered = allSets.filter(c => c.status === 'assembled');
      if (action === 'receive') filtered = allSets.filter(c => c.status === 'dispatched');
      if (action === 'return') filtered = allSets.filter(c => c.status === 'received' || c.status === 'dispatched');
      setAvailableSets(filtered);
      localStorage.setItem('cached_sets', JSON.stringify(allSets));
    }).catch(() => console.warn("Offline: Using cached sets."));

    const cachedAssets = localStorage.getItem('cached_assets');
    if (cachedAssets) {
      const assets = JSON.parse(cachedAssets);
      applyAssetFilter(assets);
    }

    getAssets(1, 1000).then(res => {
      const assets = res.data.data || res.data;
      applyAssetFilter(assets);
      localStorage.setItem('cached_assets', JSON.stringify(assets));
    }).catch(() => console.warn("Offline: Using cached assets."));

  }, [action]);

  const applyAssetFilter = (assets) => {
    if (action === 'dispatch') setAvailableAssets(assets.filter(a => a.status === 'available' && !a.set_id));
    else if (action === 'return') setAvailableAssets(assets.filter(a => a.status === 'in_use' && !a.set_id));
    else setAvailableAssets(assets.filter(a => !a.set_id)); 
  };

  // ✅ 3. Combine Sets and Parts for the dropdown simulator
  const combinedOptions = useMemo(() => {
    const sets = availableSets.map(s => ({
      ...s, isSet: true, id: s.set_id, display: `[SET] ${s.set_id} (${s.vehicle_type})`
    }));
    const parts = availableAssets.map(a => ({
      ...a, isSet: false, id: a.asset_id, display: `[PART] ${a.asset_id} (${a.type})`
    }));
    return [...sets, ...parts];
  }, [availableSets, availableAssets]);

  // ✅ 4. HARDWARE SCANNER LISTENER (Keyboard Wedge)
  useEffect(() => {
    let barcode = '';
    let timeout = null;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (barcode.length > 2) {
          processHardwareScan(barcode);
          barcode = '';
        }
        return;
      }

      if (e.key.length === 1) {
        barcode += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => { barcode = ''; }, 100); 
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [availableSets, availableAssets, scannedItems]); 

  const processHardwareScan = (scannedTag) => {
    const cleanTag = scannedTag.trim();

    const setMatch = availableSets.find(s => s.set_id === cleanTag);
    if (setMatch) {
      handleAddItem({ ...setMatch, isSet: true, id: setMatch.set_id, display: `[SET] ${setMatch.set_id}` });
      return;
    }

    const partMatch = availableAssets.find(a => a.rfid_tag_id === cleanTag || a.asset_id === cleanTag);
    if (partMatch) {
      handleAddItem({ ...partMatch, isSet: false, id: partMatch.asset_id, display: `[PART] ${partMatch.asset_id}` });
      return;
    }

    setScanResult({ success: false, message: `Tag "${cleanTag}" not found in current available items.` });
    setTimeout(() => setScanResult(null), 3000);
  };

  const handleAddItem = async (item) => {
    if (!item) return;
    
    if (!scannedItems.find(i => i.id === item.id)) {
      if (item.isSet) {
        try {
          const res = await getContainerDetails(item.set_id);
          const tags = res.data.components.map(c => c.rfid_tag_id);
          setScannedItems(prev => [...prev, { id: item.id, isSet: true, data: item, tags }]);
        } catch (err) {
          const proceed = window.confirm("You are offline and cannot fetch set components. Queue this set scan anyway?");
          if (proceed) {
            setScannedItems(prev => [...prev, { id: item.id, isSet: true, data: item, tags: [`OFFLINE_SET_${item.set_id}`] }]);
          }
        }
      } else {
        setScannedItems(prev => [...prev, { id: item.id, isSet: false, data: item, tags: [item.rfid_tag_id] }]);
      }
    }
  };

  const handleRemoveItem = (id) => {
    setScannedItems(scannedItems.filter(i => i.id !== id));
  };

  // ✅ 5. REAL-TIME RECIPE TRACKER
    const recipeStatus = useMemo(() => {
    if (scannedItems.length === 0) return null;

    // ── Existing (already assembled) sets that were scanned ──
    const existingSets = scannedItems
      .filter(i => i.isSet)
      .map(i => ({
        id: i.id,
        vehicle: i.data.vehicle_type || '—',
        parts:
          (i.tags || []).filter(t => !String(t).startsWith('OFFLINE_SET_')).length ||
          i.data.component_count || 0,
      }));

    // ── Loose parts ──
    const loose = scannedItems.filter(i => !i.isSet);
    const pool = {};
    loose.forEach(i => { pool[i.data.type] = (pool[i.data.type] || 0) + 1; });

    const takeFrom = (type, max) => {
      const got = Math.min(pool[type] || 0, max);
      pool[type] = (pool[type] || 0) - got;
      return got;
    };

    // Every container: exactly 1 Pallet, 1 Sleeve, 1 Lid. Inserts and Layer Pads depend on the vehicle.
    const buildContainer = (vehicle, insertsNeeded, isDraft = false) => {
      const need = {
        Pallet: 1,
        Sleeve: 1,
        Lid: 1,
        'Layer Pad': LAYER_PADS_PER[vehicle],
        Insert: insertsNeeded,
      };
      const parts = {};
      const missing = [];
      for (const [type, n] of Object.entries(need)) {
        // a draft only previews progress; it does not use up parts
        const have = isDraft ? Math.min(pool[type] || 0, n) : takeFrom(type, n);
        parts[type] = { have, need: n };
        if (have < n) missing.push(n - have > 1 ? `${type} x${n - have}` : type);
      }
      return { vehicle, parts, missing, complete: missing.length === 0, isDraft };
    };

    // Only Dispatch builds new containers from loose parts (same rule as the backend)
    const canForm = action === 'dispatch';
    let containers = [];
    if (canForm && loose.length > 0) {
      const sizes = splitInserts(pool['Insert'] || 0);
      containers = sizes.map(s => buildContainer(s === 3 ? 'Scooter' : 'Motorcycle', s));
      if (containers.length === 0) containers.push(buildContainer('Motorcycle', 2, true));
    }

    const leftover = Object.entries(pool).filter(([, n]) => n > 0);
    const realContainers = containers.filter(c => !c.isDraft);

    let haveTotal = 0, needTotal = 0;
    containers.forEach(c => Object.values(c.parts).forEach(p => { haveTotal += p.have; needTotal += p.need; }));

    return {
      canForm,
      existingSets,
      containers,
      leftover,
      looseCount: loose.length,
      newCount: realContainers.length,
      totalSets: existingSets.length + realContainers.length,
      completeCount: realContainers.filter(c => c.complete).length,
      incompleteCount: realContainers.filter(c => !c.complete).length,
      percent: containers.length ? Math.round((haveTotal / needTotal) * 100) : null,
    };
  }, [scannedItems, action]);

  const handleProcess = async () => {
    if (scannedItems.length === 0) return;
    if (!deviceInfo) return setScanResult({ success: false, message: 'Device not registered.' });

    setLoading(true);
    setScanResult(null);

    try {
      let allTags = scannedItems.flatMap(item => item.tags || []);
      let payload, actionType;

      if (action === 'dispatch') {
        payload = {
          scanned_rfid_tags: allTags,
          destination_location_id: deviceInfo.location_id,
          vehicle_no: scanMode === 'gate' ? vehicleNo : 'NA',
          driver_name: scanMode === 'gate' ? driverName : 'NA',
          action: 'dispatch',
        };
        actionType = 'DISPATCH';
      } else if (action === 'receive') {
        payload = scanMode === 'gate' 
          ? { scanned_rfid_tags: allTags } 
          : { 
              scanned_rfid_tags: allTags, 
              destination_location_id: deviceInfo.location_id, 
              vehicle_no: 'NA', 
              driver_name: 'NA',
              action: 'receive'
            };
        actionType = scanMode === 'gate' ? 'RECEIVE' : 'UNIFIED';
      } else if (action === 'return') {
        payload = scanMode === 'gate' 
          ? { scanned_rfid_tags: allTags, return_location_id: deviceInfo.location_id }
          : { 
              scanned_rfid_tags: allTags, 
              destination_location_id: deviceInfo.location_id, 
              vehicle_no: 'NA', 
              driver_name: 'NA',
              action: 'return'
            };
        actionType = scanMode === 'gate' ? 'RETURN' : 'UNIFIED';
      }

      if (!navigator.onLine) {
        await queueScan(actionType, payload);
        
        const scannedIds = scannedItems.map(i => i.id);
        setAvailableSets(prev => prev.filter(s => !scannedIds.includes(s.set_id)));
        setAvailableAssets(prev => prev.filter(a => !scannedIds.includes(a.asset_id)));

        setScanResult({ success: true, isOffline: true, message: 'Offline. Scan saved and will sync automatically.' });
        setScannedItems([]);
        return;
      }

      let res;
      if (action === 'dispatch') res = await unifiedScan(payload);
      else if (action === 'receive') res = scanMode === 'gate' ? await bulkReceive(payload) : await unifiedScan(payload);
      else if (action === 'return') res = scanMode === 'gate' ? await bulkReturn(payload) : await unifiedScan(payload);

      setScanResult({ success: true, message: res.data.message, challan_no: res.data.challan_no });
      setScannedItems([]);

      const refreshedSets = await getAllContainers();
      let filtered = [];
      if (action === 'dispatch') filtered = refreshedSets.data.filter(c => c.status === 'assembled');
      if (action === 'receive') filtered = refreshedSets.data.filter(c => c.status === 'dispatched');
      if (action === 'return') filtered = refreshedSets.data.filter(c => c.status === 'received' || c.status === 'dispatched');
      setAvailableSets(filtered);
      localStorage.setItem('cached_sets', JSON.stringify(refreshedSets.data));

      getAssets(1, 1000).then(res => {
        const assets = res.data.data || res.data;
        applyAssetFilter(assets);
        localStorage.setItem('cached_assets', JSON.stringify(assets));
      });

    } catch (err) {
      setScanResult({ success: false, message: err.response?.data?.error || 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = () => action === 'dispatch' ? '#027A48' : action === 'receive' ? '#175CD3' : '#B54708';

  return (
    <Card sx={{
      border: '2px solid #0A1929',
      width: '100%',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden',
    }}>
      {/* ── Header bar ── */}
      <Box sx={{
        backgroundColor: '#0A1929',
        color: 'white',
        p: { xs: 1, sm: 1.5 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        gap: 1,
      }}>
        <Typography variant="subtitle2" sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          fontSize: { xs: 12, sm: 14 },
          minWidth: 0, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {scanMode === 'gate' ? <Sensors fontSize="small" /> : <QrCodeScanner fontSize="small" />}
          {scanMode === 'gate' ? 'Automated Fixed Gate' : 'Manual Handheld'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Chip
            icon={<Wifi sx={{ fontSize: '12px !important', color: '#12B76A' }} />}
            label="HARDWARE"
            size="small"
            sx={{ bgcolor: 'rgba(18, 183, 106, 0.15)', color: '#12B76A', fontWeight: 700, border: '1px solid #12B76A', height: 22, fontSize: { xs: 10, sm: 12 } }}
          />
          <Chip
            label={scanMode === 'gate' ? 'GATE' : 'HANDHELD'}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', height: 22, fontSize: { xs: 10, sm: 12 } }}
          />
        </Box>
      </Box>

      {/* ── Device info bar ── */}
      {deviceInfo && (
        <Box sx={{
          p: { xs: 0.75, sm: 1.5 },
          bgcolor: '#ECFDF3',
          borderBottom: '1px solid #ABEFC6',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
        }}>
          <CheckCircle sx={{ color: '#12B76A', fontSize: 18 }} />
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
            <Typography sx={{
              fontSize: { xs: 11, sm: 13 }, fontWeight: 700, color: '#027A48',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {deviceInfo.device_name}
            </Typography>
            <Typography sx={{ fontSize: { xs: 10, sm: 12 }, color: '#027A48', display: { xs: 'none', sm: 'block' } }}>
              Locked to: {deviceInfo.location_name}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Card content ── */}
      <CardContent sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        pt: { xs: 0.75, sm: 2 },
        px: { xs: 1, sm: 2 },
        pb: { xs: 1, sm: 2 },
        '&:last-child': { pb: { xs: 1, sm: 2 } },
      }}>

        {/* Fixed top controls */}
        <Box sx={{ flexShrink: 0 }}>
          {/* Scan mode */}
          <ToggleButtonGroup
            color="secondary" value={scanMode} exclusive
            onChange={(e, v) => { if (v) setScanMode(v); }}
            fullWidth size="small" sx={{ mb: { xs: 1, sm: 2 } }}
          >
            <ToggleButton value="gate" sx={{ py: { xs: 0.4, sm: 0.75 }, fontSize: { xs: 11, sm: 13 } }}>
              <Sensors sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 16, sm: 18 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Fixed Gate</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Gate</Box>
            </ToggleButton>
            <ToggleButton value="handheld" sx={{ py: { xs: 0.4, sm: 0.75 }, fontSize: { xs: 11, sm: 13 } }}>
              <Person sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 16, sm: 18 } }} />
              Handheld
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Action */}
          <ToggleButtonGroup
            color="primary" value={action} exclusive
            onChange={(e, v) => { if (v) setAction(v); }}
            fullWidth sx={{ mb: { xs: 1.5, sm: 3 } }}
          >
            <ToggleButton
              value="dispatch"
              sx={{
                fontWeight: 600,
                py: { xs: 0.4, sm: 0.75 },
                fontSize: { xs: 11, sm: 13 },
                gap: { xs: 0.25, sm: 0.5 },
              }}
            >
              <Outbox sx={{ fontSize: { xs: 16, sm: 18 }, mr: { xs: 0.25, sm: 0.75 } }} />
              Dispatch
            </ToggleButton>
            <ToggleButton
              value="receive"
              sx={{
                fontWeight: 600,
                py: { xs: 0.4, sm: 0.75 },
                fontSize: { xs: 11, sm: 13 },
                gap: { xs: 0.25, sm: 0.5 },
              }}
            >
              <MoveToInbox sx={{ fontSize: { xs: 16, sm: 18 }, mr: { xs: 0.25, sm: 0.75 } }} />
              Receive
            </ToggleButton>
            <ToggleButton
              value="return"
              sx={{
                fontWeight: 600,
                py: { xs: 0.4, sm: 0.75 },
                fontSize: { xs: 11, sm: 13 },
                gap: { xs: 0.25, sm: 0.5 },
              }}
            >
              <AssignmentReturn sx={{ fontSize: { xs: 16, sm: 18 }, mr: { xs: 0.25, sm: 0.75 } }} />
              Return
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Vehicle + Driver */}
          {action === 'dispatch' && scanMode === 'gate' && (
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 1.5, sm: 3 } }}>
              <Grid item size={{ xs: 6 }}>
                <TextField
                  fullWidth size="small" label="Vehicle No."
                  value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)}
                />
              </Grid>
              <Grid item size={{ xs: 6 }}>
                <TextField
                  fullWidth size="small" label="Driver Name"
                  value={driverName} onChange={(e) => setDriverName(e.target.value)}
                />
              </Grid>
            </Grid>
          )}

          {/* Autocomplete */}
          <Box sx={{ mb: { xs: 1, sm: 2 } }}>
            <Autocomplete
              options={combinedOptions.filter(o => !scannedItems.find(i => i.id === o.id))}
              getOptionLabel={(option) => option.display}
              onChange={(e, val) => handleAddItem(val)}
              value={null}
              size="small"
              renderInput={(params) => <TextField {...params} label="Simulate Scan" size="small" />}
            />
          </Box>
        </Box>

        {/* Scan summary: sets scanned + containers formed */}
        {recipeStatus && (
          <Box
            role="status" aria-live="polite"
            sx={{
              mb: { xs: 1, sm: 2 },
              p: { xs: 0.75, sm: 1.5 },
              bgcolor: '#F9FAFB',
              border: '1px solid #EAECF0',
              borderRadius: 2,
              minWidth: 0,
              flexShrink: 0,
              maxHeight: { xs: 220, sm: 300 },
              overflowY: 'auto',
            }}
          >
            {/* Header: total sets */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
              <Typography sx={{
                fontSize: { xs: 11, sm: 13 }, fontWeight: 700,
                color: recipeStatus.totalSets > 0 ? '#027A48' : '#475467',
                display: 'flex', alignItems: 'center', gap: 0.5,
              }}>
                <LocalShipping sx={{ fontSize: { xs: 15, sm: 18 } }} />
                {recipeStatus.totalSets} set{recipeStatus.totalSets === 1 ? '' : 's'} in this scan
              </Typography>
              {recipeStatus.percent !== null && (
                <Typography sx={{ fontSize: { xs: 9, sm: 11 }, fontWeight: 600, color: '#667085' }}>
                  {recipeStatus.percent}% parts
                </Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: { xs: 9, sm: 11 }, color: '#667085', mb: 0.75 }}>
              {recipeStatus.existingSets.length} existing · {recipeStatus.newCount} new
              {recipeStatus.newCount > 0 && ` (${recipeStatus.completeCount} complete, ${recipeStatus.incompleteCount} incomplete)`}
            </Typography>

            {recipeStatus.percent !== null && (
              <LinearProgress
                variant="determinate"
                value={recipeStatus.percent}
                aria-label={`${recipeStatus.percent}% of expected parts scanned`}
                sx={{
                  height: { xs: 4, sm: 6 }, borderRadius: 3, bgcolor: '#EAECF0', mb: 1,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: recipeStatus.incompleteCount === 0 && recipeStatus.newCount > 0 ? '#12B76A' : '#5B5BD6',
                    transition: 'transform 0.3s ease',
                  },
                }}
              />
            )}

            {/* Existing sets that were scanned */}
            {recipeStatus.existingSets.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography sx={{
                  fontSize: 10, fontWeight: 700, color: '#475467',
                  textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5,
                }}>
                  Scanned sets ({recipeStatus.existingSets.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {recipeStatus.existingSets.map(s => (
                    <Chip
                      key={s.id}
                      size="small"
                      label={`${s.id} · ${s.vehicle}${s.parts ? ` · ${s.parts} parts` : ''}`}
                      sx={{ height: 22, fontSize: 10, fontWeight: 600, bgcolor: '#E0EAFF', color: '#1D4ED8' }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* New containers formed from loose parts (Dispatch only) */}
            {recipeStatus.containers.length > 0 && (
              <Typography sx={{
                fontSize: 10, fontWeight: 700, color: '#475467',
                textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5,
              }}>
                {recipeStatus.containers[0].isDraft
                  ? 'Building first container'
                  : `New containers from loose parts (${recipeStatus.newCount})`}
              </Typography>
            )}
            {recipeStatus.containers.map((c, idx) => (
              <Box
                key={idx}
                sx={{
                  mb: 0.75, p: 1, borderRadius: 1.5, border: '1px solid',
                  borderColor: c.complete ? '#ABEFC6' : '#FEDF89',
                  bgcolor: c.complete ? '#ECFDF3' : '#FFFAEB',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 700, color: '#101828' }}>
                    {c.isDraft ? 'Draft' : `New container ${idx + 1}`} · {c.vehicle}
                  </Typography>
                  <Chip
                    size="small"
                    icon={c.complete
                      ? <CheckCircle sx={{ fontSize: '14px !important' }} />
                      : <Warning sx={{ fontSize: '14px !important' }} />}
                    label={c.complete ? 'Complete' : 'Incomplete'}
                    sx={{
                      height: 20, fontSize: 10, fontWeight: 700,
                      bgcolor: c.complete ? '#D1FADF' : '#FEF0C7',
                      color: c.complete ? '#027A48' : '#B54708',
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  {Object.entries(c.parts).map(([type, { have, need }]) => (
                    <Typography key={type} sx={{
                      fontSize: 10,
                      color: have >= need ? '#027A48' : '#B54708',
                      fontWeight: have >= need ? 700 : 500,
                    }}>
                      {type}: {have}/{need}
                    </Typography>
                  ))}
                </Box>

                {!c.complete && (
                  <Typography sx={{ fontSize: 10, color: '#B54708', mt: 0.25 }}>
                    Missing: {c.missing.join(', ')}
                  </Typography>
                )}
              </Box>
            ))}

            {/* Loose parts not in any container */}
            {recipeStatus.leftover.length > 0 && (
              <Typography sx={{ fontSize: 10, color: '#667085', mt: 0.5 }}>
                Unassigned loose parts: {recipeStatus.leftover.map(([t, n]) => `${t} x${n}`).join(', ')}
              </Typography>
            )}

            {/* Explain what will happen on Receive / Return */}
            {!recipeStatus.canForm && recipeStatus.looseCount > 0 && (
              <Typography sx={{ fontSize: 10, color: '#B54708', mt: 0.5 }}>
                {scanMode === 'gate'
                  ? `Gate ${action} processes sets only. ${recipeStatus.looseCount} loose part(s) will be ignored.`
                  : `Loose parts are only marked available at this location. No container is built on ${action}.`}
              </Typography>
            )}

            {recipeStatus.newCount > 0 && (
              <Typography sx={{ fontSize: 9, color: '#98A2B3', mt: 0.5 }}>
                New container IDs are assigned when you press Confirm.
              </Typography>
            )}
          </Box>
        )}

        {/* Scanned items list — scrollable, gets remaining height */}
        {scannedItems.length > 0 && (
          <Box sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            mb: { xs: 1, sm: 2 },
            overflow: 'hidden',
          }}>
            <Box sx={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', mb: 0.5,
              flexShrink: 0, gap: 1,
            }}>
              <Typography variant="caption" color="text.secondary" sx={{
                textTransform: 'uppercase', letterSpacing: 0.5,
                fontWeight: 600, fontSize: { xs: 10, sm: 11 },
              }}>
                Scanned ({scannedItems.length})
              </Typography>
              <Button
                size="small" color="error"
                onClick={() => setScannedItems([])}
                sx={{ fontSize: { xs: 10, sm: 11 }, textTransform: 'none', py: 0, minWidth: 'auto' }}
              >
                Clear All
              </Button>
            </Box>

            <Box sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              pr: 0.5,
            }}>
              {scannedItems.map(item => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    bgcolor: '#F9FAFB',
                    mb: 0.75,
                    borderRadius: 1,
                    p: { xs: 0.6, sm: 1.25 },
                    minWidth: 0,
                  }}
                >
                  <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                    <Typography sx={{
                      fontWeight: 600,
                      fontSize: { xs: 11, sm: 13 },
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      lineHeight: 1.3,
                    }}>
                      {item.id}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: 9, sm: 11 }, color: 'text.secondary' }}>
                      {item.isSet ? `Set (${item.data.vehicle_type})` : `Loose (${item.data.type})`}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveItem(item.id)}
                    sx={{ flexShrink: 0, p: 0.25 }}
                    aria-label={`Remove ${item.id}`}
                  >
                    <Delete sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Bottom confirm bar */}
        <Box sx={{ flexShrink: 0, mt: 'auto', pt: { xs: 0.5, sm: 1 } }}>
          <Divider sx={{ my: { xs: 1, sm: 2 } }} />
          <Button
            variant="contained" fullWidth
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Receipt />}
            onClick={handleProcess}
            disabled={loading || scannedItems.length === 0 || !deviceInfo}
            sx={{
              py: { xs: 0.9, sm: 1.2 },
              bgcolor: getActionColor(),
              '&:hover': { filter: 'brightness(0.9)' },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: 12, sm: 14 },
            }}
          >
            {loading ? 'Processing...' : `Confirm ${scanMode === 'gate' ? 'Automated Bulk ' : 'Manual '}${action.charAt(0).toUpperCase() + action.slice(1)}`}
          </Button>

          {scanResult && (
            <Alert
              severity={scanResult.isOffline ? "warning" : (scanResult.success ? "success" : "error")}
              icon={scanResult.isOffline ? <WifiOff /> : (scanResult.success ? <CheckCircle /> : <Warning />)}
              sx={{ mt: { xs: 1, sm: 2 }, py: { xs: 0, sm: 0.5 } }}
            >
              <Typography sx={{ fontSize: { xs: 11, sm: 13 } }}>{scanResult.message}</Typography>
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}