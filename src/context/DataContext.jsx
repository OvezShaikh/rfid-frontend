import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAssets, getContainers, getAdminStats } from '../services/api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [containers, setContainers] = useState([]);
  const [counts, setCounts] = useState({ assets: 0, containers: 0, exceptions: 0 });

  const refreshAll = useCallback(async () => {
    try {
      const [a, c, s] = await Promise.all([
        getAssets(), // We changed this in api.js to fetch paginated data
        getContainers(),
        getAdminStats()
      ]);
      
      // FIX: 'a.data' is now { data: [...], total: X }. We need 'a.data.data'.
      // If it's a flat array (just in case), fallback to a.data.
      const assetArray = a.data.data ? a.data.data : a.data;
      setAssets(assetArray || []);
      
      setContainers(c.data);
      setCounts(s.data);
    } catch (err) {
      console.error('Global data fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <DataContext.Provider value={{ assets, containers, counts, refreshAll }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);