import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField, MenuItem,
  Select, InputLabel, FormControl, Button, Alert, Divider, Chip, Stack,
  Autocomplete, CircularProgress
} from '@mui/material';
import { 
  PlaylistAdd, CheckCircle, Inventory2, Layers, Grid4x4, ViewStream, ClearAll 
} from '@mui/icons-material';
import { getVehicleConfigs, getAssets, assembleContainer } from '../services/api';
import lidImg from '../assets/lid.png';

const TYPE_ICON = {
  Pallet: <Inventory2 sx={{ color: '#F5B041', fontSize: 20 }} />,
  Sleeve: <Layers sx={{ color: '#2E90FA', fontSize: 20 }} />,
  Lid: <Box component="img" src={lidImg} sx={{ width: 20, height: 20, objectFit: 'contain' }} />,
  Insert: <Grid4x4 sx={{ color: '#E67E22', fontSize: 20 }} />,
  'Layer Pad': <ViewStream sx={{ color: '#8E44AD', fontSize: 20 }} />,
};

// ── 1. NEW SUB-COMPONENT FOR SERVER-SIDE SEARCH ──
const AsyncSlotAutocomplete = ({ slot, selectedParts, handlePartSelect }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOptions = async (inputValue) => {
    setLoading(true);
    try {
      // Fetch from backend
      const res = await getAssets(1, 20, inputValue, slot.type, 'available', true);
      let fetched = res.data.data || res.data;
      
      // 1. STRICT SAFEGUARD: Force it to only show the exact slot type (e.g., only Pallets)
      fetched = fetched.filter(a => a.type === slot.type);
      
      // 2. Filter out assets already selected in other slots
      const selectedValues = Object.values(selectedParts).filter(Boolean);
      fetched = fetched.filter(a => !selectedValues.includes(a.asset_id));
      
      setOptions(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial options when the dropdown is first opened
  useEffect(() => {
    fetchOptions('');
  }, []);

  const selectedAsset = options.find(a => a.asset_id === selectedParts[slot.key]) || null;

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option) => option.asset_id}
      value={selectedAsset}
      onChange={(e, newValue) => handlePartSelect(slot.key, newValue?.asset_id || '')}
      onInputChange={(e, newInputValue) => {
        // When the user types, fetch from the server!
        fetchOptions(newInputValue);
      }}
      loading={loading}
      renderInput={(params) => (
        <TextField 
          {...params} 
          label={slot.label} 
          size="small" 
          placeholder="Type to search..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps?.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
          <Box sx={{ flexShrink: 0 }}>{TYPE_ICON[slot.type]}</Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {option.asset_id}
            </Typography>
            <Typography variant="caption" sx={{ color: '#667085', lineHeight: 1.2 }}>
              Tag: {option.rfid_tag_id}
            </Typography>
          </Box>
        </Box>
      )}
      noOptionsText={`No available ${slot.type}s found`}
    />
  );
};

export default function AssemblyForm({ onAssembled }) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [vehicleType, setVehicleType] = useState('');
  const [setId, setSetId] = useState('');
  const [selectedParts, setSelectedParts] = useState({}); 
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // 2. FIXED: ONLY fetch rules on mount. We no longer fetch assets here!
    getVehicleConfigs()
      .then((configRes) => {
        setConfigs(configRes.data);
        if (configRes.data.length > 0) setVehicleType(configRes.data[0].vehicle_type);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load assembly rules.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (vehicleType) {
      const prefix = vehicleType === 'Motorcycle' ? 'FLC-M' : 'FLC-S';
      setSetId(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [vehicleType]);

  const currentRule = configs.find(c => c.vehicle_type === vehicleType) || { required_inserts: 0, required_layer_pads: 0 };

  const slots = [
    { key: 'Pallet-0', label: 'Pallet', type: 'Pallet', required: true },
    { key: 'Sleeve-0', label: 'Sleeve', type: 'Sleeve', required: true },
    { key: 'Lid-0', label: 'Lid', type: 'Lid', required: true },
    ...Array.from({ length: currentRule.required_inserts }).map((_, i) => ({
      key: `Insert-${i}`, label: `Insert ${i + 1}`, type: 'Insert', required: true
    })),
    ...Array.from({ length: currentRule.required_layer_pads }).map((_, i) => ({
      key: `Layer Pad-${i}`, label: `Layer Pad ${i + 1}`, type: 'Layer Pad', required: true
    })),
  ];

  const handlePartSelect = (slotKey, assetId) => {
    setSelectedParts(prev => ({ ...prev, [slotKey]: assetId }));
  };

  const handleClear = () => {
    setSelectedParts({});
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setError(null); setSuccess(false);
    
    if (Object.keys(selectedParts).length < 2) {
        setError('Please select at least 2 components to form a set.');
        return;
    }

    const asset_ids = Object.values(selectedParts);

    try {
      await assembleContainer({ set_id: setId, vehicle_type: vehicleType, asset_ids });
      setSuccess(true);
      setSelectedParts({});
      if (onAssembled) onAssembled();
    } catch (err) {
      setError(err.response?.data?.error || 'Assembly failed.');
    }
  };

  if (loading) return <Typography>Loading assembly rules...</Typography>;

  const filledCount = Object.keys(selectedParts).length;

  return (
    <Card sx={{ width: '100%', mx: 'auto', boxShadow: '0px 4px 20px rgba(16,24,40,0.08)' }}>
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#101828' }}>
              Assemble New Set
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Link components together into a trackable set based on vehicle rules.
            </Typography>
          </Box>
          <Chip 
            label={`${filledCount} / ${slots.length} Slots Filled`} 
            color={filledCount === slots.length ? "success" : "default"}
            sx={{ fontWeight: 600 }} 
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>Set assembled successfully! Components are locked.</Alert>}

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 3, 
          mb: 4,
          alignItems: 'stretch' 
        }}>
          
          <Box sx={{ flex: 1, p: 3, bgcolor: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: '#101828' }}>
              1. Set Configuration
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select 
                    value={vehicleType} 
                    label="Vehicle Type" 
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    {configs.map(c => (
                      <MenuItem key={c.vehicle_type} value={c.vehicle_type}>
                        {c.vehicle_type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Set ID (Auto-generated)" 
                  value={setId} 
                  onChange={(e) => setSetId(e.target.value)} 
                  InputProps={{ sx: { bgcolor: '#F9FAFB' } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ flex: 1, p: 3, bgcolor: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: 2, minWidth: 0 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#101828' }}>
                2. Required Components
              </Typography>
              <Typography variant="caption" sx={{ color: '#667085', display: 'block', mt: 0.5 }}>
                Type to search the entire database
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
              gap: 2,
              width: '100%' 
            }}>
              {slots.map((slot) => (
                <Box key={slot.key} sx={{ minWidth: 0 }}>
                  
                  {/* 3. USING THE ASYNC AUTOCOMPLETE */}
                  <AsyncSlotAutocomplete 
                    slot={slot}
                    selectedParts={selectedParts}
                    handlePartSelect={handlePartSelect}
                  />
                  
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'fit-content' } }}>
          <Button 
            variant="outlined" 
            size="large" 
            startIcon={<ClearAll />} 
            onClick={handleClear}
            sx={{ py: 1.5, px: 4, textTransform: 'none', borderColor: '#D0D5DD', color: '#344054', width: { xs: '100%', sm: 'auto' } }}
          >
            Clear
          </Button>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<PlaylistAdd />} 
            onClick={handleSubmit}
            disabled={filledCount < 2}
            sx={{ py: 1.5, px: 4, bgcolor: '#102A43', '&:hover': { bgcolor: '#1E3A5F' }, textTransform: 'none', fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
          >
            Assemble Set
          </Button>
        </Stack>

      </CardContent>
    </Card>
  );
}