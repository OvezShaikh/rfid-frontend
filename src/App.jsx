import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import AppRouting from './AppRouting';
import { syncOfflineScans } from './services/offlineDB'; // ✅ Import sync function

export default function App() {
  // ✅ Trigger offline sync on app load and when internet returns
  useEffect(() => {
    // 1. Check for pending scans when the app first loads
    syncOfflineScans();

    // 2. Listen for the browser going back online
    const handleOnline = () => {
      console.log("Internet restored. Syncing offline scans...");
      syncOfflineScans();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRouting />
      </BrowserRouter>
    </ThemeProvider>
  );
}