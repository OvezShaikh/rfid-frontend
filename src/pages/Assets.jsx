import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Slide } from '@mui/material';
import { useLocation } from 'react-router-dom';
import AssetForm from '../components/AssetForm';
import AssetList from '../components/AssetList';
import ComponentTypesCard from '../components/ComponentTypesCard';
import { getAssets } from '../services/api';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [selectedType, setSelectedType] = useState('Pallet');
  const [editingAsset, setEditingAsset] = useState(null);

  const location = useLocation();

  const fetchAssets = async () => {
    const res = await getAssets();
    setAssets(res.data);
    return res.data;
  };

  useEffect(() => {
    fetchAssets().then((data) => {
      if (location.state?.searchAssetId) {
        const target = data.find((a) => a.id === location.state.searchAssetId);
        if (target) handleEdit(target);
      }
    });
  }, [location.state]);

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setSelectedType(asset.type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => setEditingAsset(null);

  const isEdit = Boolean(editingAsset);

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        {isEdit ? 'Editing Asset' : 'Assets'}
      </Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        {isEdit
          ? `You are modifying ${editingAsset.asset_id} — changes are immediate and audited`
          : 'Register, edit and track every Pallet, Sleeve and Lid'}
      </Typography>

      {isEdit ? (
        // ── EDIT MODE: full-width form only ──
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Slide direction="down" in={isEdit} mountOnEnter unmountOnExit>
            <Box>
              <AssetForm
                onRefresh={fetchAssets}
                onTypeChange={setSelectedType}
                editing={editingAsset}
                onCancelEdit={handleCancelEdit}
              />
            </Box>
          </Slide>
        </Box>
      ) : (
        // ── CREATE MODE: normal 3-column layout ──
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <AssetForm
              onRefresh={fetchAssets}
              onTypeChange={setSelectedType}
              editing={null}
              onCancelEdit={handleCancelEdit}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <ComponentTypesCard selectedType={selectedType} assets={assets} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <AssetList
              assets={assets}
              onRefresh={fetchAssets}
              onEdit={handleEdit}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}