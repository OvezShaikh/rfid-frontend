import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAssets, getContainers, getAdminStats } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [containers, setContainers] = useState([]);
  const [counts, setCounts] = useState({ assets: 0, containers: 0, exceptions: 0 });

  // ── CRITICAL FIX: 'user' must be in the dependency array! ──
  const refreshAll = useCallback(async () => {
    if (!user) return; // Do not fetch if not logged in

    try {
      const [a, c, s] = await Promise.all([
        getAssets(),
        getContainers(),
        getAdminStats()
      ]);
      
      // Safely extract the array (handles both paginated and flat responses)
      const assetArray = a.data?.data || a.data || [];
      setAssets(assetArray);
      
      setContainers(c.data || []);
      setCounts(s.data || { assets: 0, containers: 0, exceptions: 0 });
      
    } catch (err) {
      console.error('Global data fetch failed:', err);
    }
  }, [user]); // <-- ADDED 'user' HERE

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <DataContext.Provider value={{ assets, containers, counts, refreshAll }}>
      {children}
    </DataContext.Provider>
  );
}

// ── OPTIMIZATION: Safe Custom Hook ──
// Just like useAuth, this prevents silent crashes if used outside the provider
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};