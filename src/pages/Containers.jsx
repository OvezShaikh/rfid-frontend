import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import AssemblyForm from '../components/AssemblyForm';
import ContainerTracker from '../components/ContainerTracker';
import { getAllContainers } from '../services/api';

export default function Containers() {
  const [tab, setTab] = useState(0);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const res = await getAllContainers();
      setContainers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const handleAssembled = () => {
    fetchContainers();
    setTab(0); // Switch to tracker view after successful assembly
  };

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>Set Management</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Assemble new containers and track the exact components linked inside them.
      </Typography>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #EAECF0' }}>
        <Tab label="Active Sets (Tracking)" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="Assemble New Set" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      {tab === 0 && (
        <ContainerTracker 
          containers={containers} 
          onRefresh={fetchContainers} 
          loading={loading} 
        />
      )}

      {tab === 1 && (
        <AssemblyForm onAssembled={handleAssembled} />
      )}
    </Box>
  );
}