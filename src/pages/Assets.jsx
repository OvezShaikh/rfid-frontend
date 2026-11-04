import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Slide } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import AssetForm from '../components/AssetForm';
import AssetList from '../components/AssetList';
import ComponentTypesCard from '../components/ComponentTypesCard';
// 1. FIXED: Imported getAsset
import { getAssets, getAsset } from '../services/api';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [selectedType, setSelectedType] = useState('Pallet');
  const [editingAsset, setEditingAsset] = useState(null);
  const [viewingAsset, setViewingAsset] = useState(null);
  
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // <-- Added state for rows per page

  const location = useLocation();
  const navigate = useNavigate();

  const fetchAssets = async () => {
    try {
      const res = await getAssets(page + 1, rowsPerPage); // <-- Use rowsPerPage
      setAssets(res.data.data);
      setTotalCount(res.data.total);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    }
  };

  // Fetch whenever the page changes
  useEffect(() => {
    fetchAssets();
  }, [page]);

  // Handle TopBar Search
  useEffect(() => {
    if (location.state?.viewAssetId) {
      getAsset(location.state.viewAssetId)
        .then((res) => {
          setViewingAsset(res.data);
          setSelectedType(res.data.type);
          setEditingAsset(null); 
        })
        .catch((err) => {
          console.error("Asset not found for search", err);
        });

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // 2. FIXED: Reset to Page 1 when a new asset is created
  const handleRefreshAfterCreate = () => {
    if (page !== 0) {
      setPage(0); // This triggers the useEffect to fetch page 1
    } else {
      fetchAssets(); // If already on page 1, just refetch
    }
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
              onRefresh={handleRefreshAfterCreate} // <-- Use the new reset logic
              onTypeChange={setSelectedType}
              editing={null}
              viewing={viewingAsset}
              onCancelEdit={handleCancel}
              onEditClick={() => handleEdit(viewingAsset)} 
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
             {/* 3. FIXED: Pass totalCount so the percentages are correct */}
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
    </Box>
  );
}