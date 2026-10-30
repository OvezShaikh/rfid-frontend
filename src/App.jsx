import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Overview';
import Assets from './pages/Assets';
import Containers from './pages/Containers';
import Exceptions from './pages/Exceptions';
import Scanner from './pages/Scanner';
import Admin from './pages/Admin';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/containers" element={<Containers />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/exceptions" element={<Exceptions />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}