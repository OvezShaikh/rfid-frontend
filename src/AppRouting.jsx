import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Login from './pages/Login';
import Landing from './pages/Landing'; // 👈 NEW IMPORT

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
import Reports from './pages/Reports';
import WhatsAppBot from './pages/WhatsAppBot';
import Devices from './pages/Devices';
import Clients from './pages/Clients';
import RfidWarehouseSandbox from './pages/RfidWarehouseSandbox';
import EmailSettingsPage from './pages/EmailSettingsPage';

// ── 1. PUBLIC ROUTE GUARD ──
const PublicRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  
  if (user) {
    // 👈 Redirect logged-in users straight to the dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};

// ── 2. PROTECTED ROUTE GUARD ──
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

// ── ROLE-BASED ROUTE GUARD ──
const RoleRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role_id)) {
    // 👈 Redirect unauthorized users to the dashboard
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function AppRouting() {
  return (
    <Routes>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PUBLIC ROUTES */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      {/* 👈 NEW: Landing page is now the root path */}
      <Route path="/" element={<Landing />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PRIVATE ROUTES (Protected by Auth Guard) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          
          {/* 👈 CHANGED: Overview is now at /dashboard */}
          <Route path="/dashboard" element={<Overview />} />
          
          <Route path="/assets" element={<Assets />} />
          <Route path="/containers" element={<Containers />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/challans" element={<DeliveryChallan />} />
          <Route path="/history" element={<History />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/rfid-warehouse-sandbox" element={<RfidWarehouseSandbox />} />
          <Route
            path="/whatsapp"
            element={
              <RoleRoute allowedRoles={[1, 2]}>
                <WhatsAppBot />
              </RoleRoute>
            }
          />
          <Route path="/devices" element={<RoleRoute allowedRoles={[1]}><Devices /></RoleRoute>} />
          <Route path="/clients" element={<RoleRoute allowedRoles={[1]}><Clients /></RoleRoute>} />
          <Route path="/email-settings" element={<RoleRoute allowedRoles={[1]}><EmailSettingsPage /></RoleRoute>} />
        </Route>
      </Route>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FALLBACK ROUTE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 👈 Fallback goes to dashboard if logged in, else handled by ProtectedRoute */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}