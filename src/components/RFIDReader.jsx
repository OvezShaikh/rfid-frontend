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

const RECIPES = {
  Motorcycle: { 'Pallet': 1, 'Lid': 1, 'Layer Pad': 2, 'Insert': 2 },
  Scooter:    { 'Pallet': 1, 'Lid': 1, 'Layer Pad': 3, 'Insert': 3 }
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
    const looseScanned = scannedItems.filter(i => !i.isSet);
    if (looseScanned.length === 0) return null;

    const counts = {};
    looseScanned.forEach(i => {
      const type = i.data.type;
      counts[type] = (counts[type] || 0) + 1;
    });

    let best = null;
    let bestScore = -1;

    for (const [vType, recipe] of Object.entries(RECIPES)) {
      const totalReq = Object.values(recipe).reduce((a, b) => a + b, 0);

      let setsComplete = Infinity;
      for (const [type, req] of Object.entries(recipe)) {
        setsComplete = Math.min(setsComplete, Math.floor((counts[type] || 0) / req));
      }
      if (!isFinite(setsComplete)) setsComplete = 0;

      const nextParts = {};
      let nextHave = 0;
      for (const [type, req] of Object.entries(recipe)) {
        const used = setsComplete * req;
        const left = Math.max(0, (counts[type] || 0) - used);
        const have = Math.min(left, req);
        nextParts[type] = { have, need: req };
        nextHave += have;
      }
      const nextPercent = totalReq === 0 ? 0 : Math.round((nextHave / totalReq) * 100);
      const score = setsComplete * 1000 + nextPercent;

      if (score > bestScore) {
        bestScore = score;
        best = { type: vType, recipe, setsComplete, nextPercent, nextParts, totalReq, counts };
      }
    }
    return best;
  }, [scannedItems]);

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
              driver_name: 'NA' 
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

        {/* Recipe progress */}
        {recipeStatus && (
          <Box 
          role="status" aria-live="polite"
          sx={{
            mb: { xs: 1, sm: 2 },
            p: { xs: 0.75, sm: 1.5 },
            bgcolor: recipeStatus.setsComplete > 0 ? '#ECFDF3' : '#F9FAFB',
            border: '1px solid',
            borderColor: recipeStatus.setsComplete > 0 ? '#ABEFC6' : '#EAECF0',
            borderRadius: 2,
            minWidth: 0,
            flexShrink: 0,
          }}>
            <Box sx={{
              display: 'flex', flexDirection: 'row',
              alignItems: 'center', justifyContent: 'space-between',
              gap: 0.5, mb: 0.5,
            }}>
              <Typography sx={{
                fontSize: { xs: 10, sm: 12 },
                fontWeight: 700,
                color: recipeStatus.setsComplete > 0 ? '#027A48' : '#475467',
                display: 'flex', alignItems: 'center', gap: 0.5,
                minWidth: 0, whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                <Build sx={{ fontSize: { xs: 14, sm: 16 } }} />
                {recipeStatus.setsComplete > 0
                  ? `${recipeStatus.setsComplete} ${recipeStatus.type} Set${recipeStatus.setsComplete > 1 ? 's' : ''} Ready`
                  : `Building ${recipeStatus.type}`}
              </Typography>
              <Typography sx={{
                fontSize: { xs: 9, sm: 11 },
                fontWeight: 600, color: '#667085', flexShrink: 0,
              }}>
                {recipeStatus.nextPercent}%
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={recipeStatus.nextPercent}
               aria-label={`${recipeStatus.nextPercent}% of next ${recipeStatus.type} set complete`}
              sx={{
                height: { xs: 4, sm: 6 },
                borderRadius: 3,
                bgcolor: '#EAECF0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: recipeStatus.setsComplete > 0 ? '#12B76A' : '#5B5BD6',
                  transition: 'transform 0.3s ease',
                },
              }}
            />

            {/* Parts breakdown — desktop only */}
            <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
              {Object.entries(recipeStatus.nextParts).map(([type, { have, need }]) => (
                <Typography key={type} sx={{
                  fontSize: 9, color: have >= need ? '#027A48' : '#667085',
                  fontWeight: have >= need ? 700 : 400,
                }}>
                  {type}: {have}/{need}
                </Typography>
              ))}
            </Box>
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