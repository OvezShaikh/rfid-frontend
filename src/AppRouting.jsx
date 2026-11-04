import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Login from './pages/Login';

// Private Pages
import Overview from './pages/Overview';
import Assets from './pages/Assets';
import Containers from './pages/Containers';
import Scanner from './pages/Scanner';
import Exceptions from './pages/Exceptions';
import DeliveryChallan from './pages/DeliveryChallan';
import History from './pages/History';
import AdminDashboard from './pages/Admin';
import Users from './pages/Users';

// ── 1. PUBLIC ROUTE GUARD ──
// If the user is ALREADY logged in, they shouldn't be able to see the login page.
const PublicRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};

// ── 2. PROTECTED ROUTE GUARD ──
// If the user is NOT logged in, redirect them to /login
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export default function AppRouting() {
  return (
    <Routes>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PUBLIC ROUTES */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PRIVATE ROUTES (Protected by Auth Guard) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/containers" element={<Containers />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/challans" element={<DeliveryChallan />} />
          <Route path="/history" element={<History />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Route>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FALLBACK ROUTE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}