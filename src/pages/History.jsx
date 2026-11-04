import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button, InputAdornment,
  Stack, Chip, CircularProgress, Alert, Divider, Tabs, Tab,
  Accordion, AccordionSummary, AccordionDetails, Tooltip
} from '@mui/material';
import {
  Search, History as HistoryIcon, Inventory2, LocalShipping,
  Build, CheckCircle, Place, Schedule, ViewInAr, MoveToInbox,
  Layers, Grid4x4, ViewStream, ExpandMore as ExpandMoreIcon 
} from '@mui/icons-material';
import { getAssetHistory, getSetHistory, getLocations, getContainerDetails } from '../services/api';
import lidImg from '../assets/lid.png';

const TYPE_ICON = {
  Pallet: <Inventory2 sx={{ color: '#F5B041', fontSize: 18 }} />,
  Sleeve: <Layers sx={{ color: '#2E90FA', fontSize: 18 }} />,
  Lid: <Box component="img" src={lidImg} sx={{ width: 18, height: 18, objectFit: 'contain' }} />,
  Insert: <Grid4x4 sx={{ color: '#E67E22', fontSize: 18 }} />,
  'Layer Pad': <ViewStream sx={{ color: '#8E44AD', fontSize: 18 }} />,
};

const ACTION_META = {
  REGISTERED:   { color: '#5B5BD6', icon: <Inventory2 fontSize="small" />, label: 'Registered' },
  ASSEMBLED:    { color: '#F79009', icon: <Build fontSize="small" />, label: 'Assembled into Set' },
  DISPATCHED:   { color: '#2E90FA', icon: <LocalShipping fontSize="small" />, label: 'Dispatched' },
  RECEIVED:     { color: '#2E90FA', icon: <MoveToInbox fontSize="small" />, label: 'Received by Customer' },
  RETURNED:     { color: '#12B76A', icon: <CheckCircle fontSize="small" />, label: 'Returned to Hub' },
  DISASSEMBLED: { color: '#667085', icon: <ViewInAr fontSize="small" />, label: 'Disassembled' },
  MOVED:        { color: '#667085', icon: <Place fontSize="small" />, label: 'Moved Location' },
};

export default function History() {
  const [tab, setTab] = useState(0); 
  const navigate = useNavigate();
  
  const [searchId, setSearchId] = useState('');
  const [history, setHistory] = useState([]);
  const [setComposition, setSetComposition] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const [locationMap, setLocationMap] = useState({});

  useEffect(() => {
    getLocations()
      .then((res) => {
        const map = {};
        res.data.forEach((loc) => { map[loc.id] = loc.location_name; });
        setLocationMap(map);
      })
      .catch((err) => console.error("Failed to load locations", err));
  }, []);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setSearchId('');
    setHistory([]);
    setSetComposition([]);
    setSearched(false);
    setError(null);
  };

  // Check if the typed ID is valid for the current tab
  const isInvalidIdForTab = 
    (tab === 0 && searchId.toUpperCase().startsWith('FLC')) || 
    (tab === 1 && searchId.length > 0 && !searchId.toUpperCase().startsWith('FLC'));

  const handleSearch = async () => {
    const cleanId = searchId.trim().toUpperCase();
    if (!cleanId) return;

    // Strict Validation based on Tab
    if (tab === 0 && cleanId.startsWith('FLC')) {
      setError("You are on the Component History tab. Please switch to 'Set History' to search for Sets.");
      return;
    }
    if (tab === 1 && !cleanId.startsWith('FLC')) {
      setError("You are on the Set History tab. Please switch to 'Component History' to search for individual parts.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSearched(true);
    setSetComposition([]);

    try {
      let resHistory;
      
      if (tab === 1) {
        // FETCH SET HISTORY AND COMPOSITION
        const [historyRes, detailsRes] = await Promise.all([
          getSetHistory(cleanId),
          getContainerDetails(cleanId).catch(() => ({ data: { components: [] } })) 
        ]);
        resHistory = historyRes;
        setSetComposition(detailsRes.data.components || []);
      } else {
        // FETCH COMPONENT HISTORY
        resHistory = await getAssetHistory(cleanId);
      }
      
      if (Array.isArray(resHistory.data)) {
        // ── OPTIMIZED GROUPING LOGIC ──
        const groupedHistory = resHistory.data.reduce((acc, curr) => {
          // Group by action_type and created_at (timestamp). 
          // This ensures all logs from a single bulk action are grouped together.
          const key = `${curr.action_type}-${curr.created_at}`;
          
          if (!acc[key]) {
            acc[key] = {
              ...curr,
              components_at_step: [curr.entity_id] // Start tracking components
            };
          } else {
            if (!acc[key].components_at_step.includes(curr.entity_id)) {
              acc[key].components_at_step.push(curr.entity_id);
            }
          }
          return acc;
        }, {});

        // Convert back to array and sort by date descending
        const uniqueHistory = Object.values(groupedHistory).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        
        setHistory(uniqueHistory);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch history. Make sure the ID is correct.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>History Tracker</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Search for individual components or whole sets to view their lifecycle.
      </Typography>

      {/* Tabs */}
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 4, borderBottom: '1px solid #EAECF0' }}>
        <Tab label="Component History" sx={{ textTransform: 'none', fontWeight: 600, fontSize: 15 }} />
        <Tab label="Set History" sx={{ textTransform: 'none', fontWeight: 600, fontSize: 15 }} />
      </Tabs>

      {/* Search Bar */}
      <Card sx={{ mb: 4, maxWidth: 600, boxShadow: '0px 2px 10px rgba(16,24,40,0.05)' }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: 2 }}>
          <TextField
            fullWidth
            size="small"
            error={isInvalidIdForTab}
            helperText={isInvalidIdForTab ? (tab === 0 ? "This is a Set ID. Switch tabs above." : "This is an Asset ID. Switch tabs above.") : ""}
            label={tab === 0 ? "Enter Asset ID (e.g. PAL-000001)" : "Enter Set ID (e.g. FLC-M-1234)"}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><Search color="action" /></InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !searchId || isInvalidIdForTab}
            sx={{ px: 4, py: 1, mt: 0.25, bgcolor: '#102A43', whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Search'}
          </Button>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {searched && !loading && history.length === 0 && !error && (
        <Alert severity="info">No history found for {searchId.toUpperCase()}.</Alert>
      )}

      {/* ── OPTIMIZED SET COMPOSITION (Compact Chips) ── */}
      {setComposition.length > 0 && (
        <Accordion sx={{
          mb: 4, boxShadow: '0px 2px 10px rgba(16,24,40,0.05)', border: '1px solid #B2DDFF',
          bgcolor: '#F0F9FF', '&:before': { display: 'none' }, borderRadius: 2, overflow: 'hidden'
        }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#175CD3' }} />} sx={{ px: 3, py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', justifyContent: 'space-between', pr: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ViewInAr sx={{ color: '#175CD3', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#175CD3' }}>Current Set Composition</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {Object.entries(setComposition.reduce((acc, curr) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {})).map(([type, count]) => (
                  <Chip key={type} label={`${count} ${type}${count > 1 ? 's' : ''}`} size="small" sx={{ bgcolor: '#E0F2FE', color: '#026AA2', fontWeight: 600, fontSize: 11 }} />
                ))}
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3, pt: 1 }}>
            <Divider sx={{ mb: 2, borderColor: '#B2DDFF' }} />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 140, overflowY: 'auto', pr: 1 }}>
              {setComposition.map((comp) => (
                <Tooltip key={comp.asset_id} title={`${comp.asset_id} | Tag: ${comp.rfid_tag_id}`} arrow placement="top">
                  <Chip
                    onClick={() => navigate('/assets', { state: { viewAssetId: comp.id, timestamp: Date.now() } })}
                    icon={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ml: 0.5 }}>{TYPE_ICON[comp.type] || <Inventory2 sx={{ fontSize: 14 }} />}</Box>}
                    label={comp.asset_id} size="small" variant="outlined"
                    sx={{ 
                      p: 1, 
                      bgcolor: '#FFF', 
                      borderColor: '#EAECF0', 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: '#344054', 
                      '& .MuiChip-icon': { color: 'inherit' },
                      cursor: 'pointer', // Makes it feel clickable
                      transition: 'all 0.2s',
                      '&:hover': { 
                        bgcolor: '#F4F3FF', 
                        borderColor: '#5B5BD6', 
                        color: '#5B5BD6' 
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Timeline Display */}
      {history.length > 0 && (
        <Card sx={{ p: { xs: 2, sm: 4 }, boxShadow: '0px 4px 20px rgba(16,24,40,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <HistoryIcon sx={{ color: '#5B5BD6', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Timeline for {searchId.toUpperCase()}</Typography>
          </Box>

          <Box sx={{ position: 'relative', ml: { xs: 0, sm: 1 } }}>
            <Box sx={{ position: 'absolute', left: '20px', top: 20, bottom: 20, width: 2, bgcolor: '#EAECF0', zIndex: 0 }} />

            <Stack spacing={3}>
              {history.map((event) => {
                const meta = ACTION_META[event.action_type] || { color: '#667085', icon: <HistoryIcon />, label: event.action_type };
                const details = typeof event.details === 'string' ? JSON.parse(event.details) : event.details;

                const locationName = details?.location_id ? (locationMap[details.location_id] || `Location ID: ${details.location_id}`) : null;
                const originName = details?.moved_from_location_id ? (locationMap[details.moved_from_location_id] || `Location ID: ${details.moved_from_location_id}`) : null;

                return (
                  <Box key={event.id} sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
                    {/* Timeline Icon */}
                    <Box sx={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      bgcolor: `${meta.color}15`, color: meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid #FFF`, boxShadow: '0px 0px 0px 2px #F2F4F7',
                    }}>
                      {meta.icon}
                    </Box>

                    {/* Event Content Card */}
                    <Box sx={{
                      flex: 1, minWidth: 0, bgcolor: '#F9FAFB', p: 2.5, borderRadius: 2,
                      border: '1px solid #EAECF0', display: 'flex', flexDirection: 'column', gap: 1.5, wordBreak: 'break-word'
                    }}>
                      {/* Header: Action & Time */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: '#101828', fontSize: 15 }}>
                          {meta.label}
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ color: '#667085', alignItems: 'center', display: 'flex' }}>
                          <Schedule sx={{ fontSize: 14, display: 'flex' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1, pt: '1px' }}>
                            {new Date(event.created_at).toLocaleString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                          </Typography>
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Details Row */}
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                        {originName && locationName ? (
                          <Chip icon={<LocalShipping sx={{ fontSize: '14px !important' }} />} label={`${originName} → ${locationName}`} size="small" sx={{ height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' }, bgcolor: '#EFF8FF', color: '#175CD3', fontWeight: 600, border: '1px solid #B2DDFF', borderRadius: 1.5 }} />
                        ) : locationName ? (
                          <Chip icon={<Place sx={{ fontSize: '14px !important' }} />} label={locationName} size="small" sx={{ height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' }, bgcolor: '#EFF8FF', color: '#175CD3', fontWeight: 600, border: '1px solid #B2DDFF', borderRadius: 1.5 }} />
                        ) : null}

                        {details?.vehicle_type && <Chip label={`Vehicle: ${details.vehicle_type}`} size="small" variant="outlined" sx={{ height: 'auto', py: 0.5, bgcolor: '#FFF', '& .MuiChip-label': { whiteSpace: 'normal' } }} />}
                        {details?.challan_no && <Chip label={`DC: ${details.challan_no}`} size="small" sx={{ height: 'auto', py: 0.5, bgcolor: '#F4F3FF', color: '#5B5BD6', fontWeight: 600, border: '1px solid #D9D6FE', '& .MuiChip-label': { whiteSpace: 'normal' } }} />}
                      </Stack>

                      {/* SHOW COMPONENTS AT THIS SPECIFIC STEP (Only on Set Tab) */}
                      {tab === 1 && event.components_at_step && event.components_at_step.length > 0 && (
                         <Box sx={{ mt: 1, p: 1.5, bgcolor: '#FFF', borderRadius: 1.5, border: '1px dashed #D0D5DD' }}>
                           <Typography variant="caption" sx={{ fontWeight: 600, color: '#475467', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                               Components involved ({event.components_at_step.length}):
                           </Typography>
                           <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 80, overflowY: 'auto' }}>
                               {event.components_at_step.map(id => (
                                   <Chip key={id} label={id} size="small" sx={{ bgcolor: '#F9FAFB', border: '1px solid #EAECF0', fontSize: 11, height: 22, fontWeight: 500 }} />
                               ))}
                           </Box>
                        </Box>
                      )}

                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Card>
      )}
    </Box>
  );
}