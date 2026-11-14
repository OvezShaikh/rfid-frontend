import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Grid, Typography, Slide, Button, Stack, Divider,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import AssetForm from '../components/AssetForm';
import AssetList from '../components/AssetList';
import ComponentTypesCard from '../components/ComponentTypesCard';
import BulkAssetImport from '../components/BulkAssetImport';
import { getAssets, getAsset } from '../services/api';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [selectedType, setSelectedType] = useState('Pallet');
  const [editingAsset, setEditingAsset] = useState(null);
  const [viewingAsset, setViewingAsset] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const location = useLocation();
  const navigate = useNavigate();

  const isEdit = Boolean(editingAsset);

  // Fetch — memoized so effects don't re-run on identity changes
  const fetchAssets = useCallback(async () => {
    try {
      const res = await getAssets(page + 1, rowsPerPage);
      setAssets(res.data.data);
      setTotalCount(res.data.total);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    }
  }, [page, rowsPerPage]);

  // Refetch on page OR rowsPerPage change
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Handle TopBar search
  useEffect(() => {
    if (location.state?.viewAssetId) {
      getAsset(location.state.viewAssetId)
        .then((res) => {
          setViewingAsset(res.data);
          setSelectedType(res.data.type);
          setEditingAsset(null);
        })
        .catch((err) => console.error('Asset not found for search', err));

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Reset to page 0 after create / bulk import
  const handleRefreshAfterCreate = () => {
    if (page !== 0) setPage(0);
    else fetchAssets();
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setViewingAsset(null);
    setSelectedType(asset.type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingAsset(null);
    setViewingAsset(null);
  };

  return (
    <Box>
      {/* ═══ Page header ═══ */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            {isEdit ? 'Editing Asset' : 'Assets'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {isEdit
              ? `You are modifying ${editingAsset.asset_id} — changes are immediate and audited`
              : 'Register, edit and track every Pallet, Sleeve, Lid, Insert and Layer Pad'}
          </Typography>
        </Box>

        {/* Actions — hidden during edit mode to keep the focus on the form */}
        {!isEdit && (
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => setBulkOpen(true)}
            sx={{
              flexShrink: 0,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#D0D5DD',
              color: '#344054',
              '&:hover': {
                borderColor: '#98A2B3',
                bgcolor: '#F9FAFB',
              },
            }}
          >
            Bulk import
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ═══ Content ═══ */}
      {isEdit ? (
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Slide direction="down" in={isEdit} mountOnEnter unmountOnExit>
            <Box>
              <AssetForm
                onRefresh={fetchAssets}
                onTypeChange={setSelectedType}
                editing={editingAsset}
                viewing={null}
                onCancelEdit={handleCancel}
              />
            </Box>
          </Slide>
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <AssetForm
              onRefresh={handleRefreshAfterCreate}
              onTypeChange={setSelectedType}
              editing={null}
              viewing={viewingAsset}
              onCancelEdit={handleCancel}
              onEditClick={() => handleEdit(viewingAsset)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <ComponentTypesCard
              selectedType={selectedType}
              assets={assets}
              totalGlobalAssets={totalCount}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <AssetList
              assets={assets}
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              onRefresh={fetchAssets}
              onEdit={handleEdit}
            />
          </Grid>
        </Grid>
      )}

      {/* Bulk import dialog — mounted once, shows over everything */}
      <BulkAssetImport
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={() => {
          setBulkOpen(false);
          handleRefreshAfterCreate(); // ← was the undefined `onRefresh`
        }}
      />
    </Box>
  );
}