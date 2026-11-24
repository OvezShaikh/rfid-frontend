import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||           // Vercel / Vite builds
  'http://localhost:5000/api';

// Create the instance
const api = axios.create({ baseURL: API_URL });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──
export const loginUser = (data) => api.post('/auth/login', data);

// ── Stats (Total Count) ──
export const getAdminStats = () => api.get('/assets/admin/stats');

// ── User Management ──
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const updateOwnProfile = (data) => api.put('/users/profile', data);
export const updateOwnPassword = (data) => api.put('/users/password', data);

// ── Assets ──
export const getAssets = (page = 1, limit = 10, search = '', type = '', status = '', availableOnly = false) => 
  api.get('/assets', { params: { page, limit, search, type, status, availableOnly } });
export const getAsset = (id) => api.get(`/assets/${id}`);
export const createAsset = (data) => api.post('/assets', data);
export const updateAsset = (id, data) => api.put(`/assets/${id}`, data);
export const deleteAsset = (id) => api.delete(`/assets/${id}`);
export const getAssetHistory = (assetId) => api.get(`/assets/history/${assetId}`);
export const getSetHistory = (setId) => api.get(`/assets/history/set/${setId}`);
export const getScanTrend = () => api.get('/assets/scan-trend'); 

// ── Locations ──
export const getLocations = () => api.get('/locations');
export const createLocation = (data) => api.post('/locations', data);
export const updateLocation = (id, data) => api.put(`/locations/${id}`, data);
export const deleteLocation = (id) => api.delete(`/locations/${id}`);

// ── Scanning ──
export const dispatchScan = (data) => api.post('/scan/dispatch', data);
export const receiveScan = (data) => api.post('/scan/receive', data); 
export const returnScan = (data) => api.post('/scan/return', data);
export const unifiedScan = (data) => api.post('/scan/unified', data);

// ── Receiving ──
export const bulkReceive = (data) => api.post('/scan/receive-bulk', data);
export const bulkReturn = (data) => api.post('/scan/return-bulk', data);

// ── Exceptions / Containers ──
export const getExceptions = () => api.get('/assets/exceptions');
export const resolveException = (id) => api.put(`/assets/exceptions/${id}/resolve`);
export const getContainers = () => api.get('/assets/containers');

// ── Vehicle Configs ──
export const getVehicleConfigs = () => api.get('/configs/vehicles');
export const createVehicleConfig = (data) => api.post('/configs/vehicles', data);

// ── Containers ──
export const assembleContainer = (data) => api.post('/containers/assemble', data);
export const getAllContainers = () => api.get('/containers');
export const getContainerDetails = (setId) => api.get(`/containers/${setId}`);
export const disassembleContainer = (setId) => api.patch(`/containers/${setId}`);

// ── Challan (DC) ──
export const createChallan = (data) => api.post('/challans', data);
export const getAllChallans = () => api.get('/challans');
export const getChallanById = (id) => api.get(`/challans/${id}`);

// ── Reports ──
export const getTurnaroundReport = (startDate, endDate) => 
  api.get('/reports/turnaround', { params: { startDate, endDate } });

export const getExceptionRateReport = (startDate, endDate) => 
  api.get('/reports/exception-rate', { params: { startDate, endDate } });

export const getLocationStockReport = () => api.get('/reports/location-stock');

export const getStuckInTransitReport = () => api.get(`/reports/stuck-in-transit?t=${Date.now()}`);
export const getDailyMovementReport = (start, end) => api.get(`/reports/daily-movement?startDate=${start}&endDate=${end}&t=${Date.now()}`);
export const getAuditExceptionsReport = (start, end) => api.get(`/reports/audit-exceptions?startDate=${start}&endDate=${end}&t=${Date.now()}`);

// ── WhatsApp Simulation ──
export const simulateWhatsApp = (message) => api.post('/whatsapp/simulate', { message });

// ── Device Management ──
export const getDevices = () => api.get('/devices');
export const getDeviceById = (id) => api.get(`/devices/${id}`);
export const createDevice = (data) => api.post('/devices', data);

// ── Clients ──
export const getClients = () => api.get('/clients');
export const createClient = (data) => api.post('/clients', data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// ── Email Settings ──
// Legacy recipients
export const getEmailSettings  = ()         => api.get('/email-settings');
export const saveEmailSettings = (data)     => api.post('/email-settings', data);
export const sendReportEmail   = (data)     => api.post('/email-settings/send', data);

// Groups
export const getEmailGroups        = ()            => api.get('/email-groups');
export const createEmailGroup      = (data)        => api.post('/email-groups', data);
export const updateEmailGroup      = (id, data)    => api.put(`/email-groups/${id}`, data);
export const deleteEmailGroup      = (id)          => api.delete(`/email-groups/${id}`);
export const addEmailGroupMember   = (id, data)    => api.post(`/email-groups/${id}/members`, data);
export const removeEmailGroupMember = (id, email)  => api.delete(`/email-groups/${id}/members/${encodeURIComponent(email)}`);

// Templates
export const getEmailTemplates     = ()         => api.get('/email-templates');
export const updateEmailTemplate   = (id, d)    => api.put(`/email-templates/${id}`, d);

// Log + test
export const getEmailLog           = (params)   => api.get('/email-log', { params });
export const testTrigger           = (data)     => api.post('/email-trigger/test', data);
export const retryEmail            = (id)       => api.post(`/email-log/${id}/retry`);

// ── Bulk Asset Creation ──
export const bulkCreateAssets = (assets) => api.post('/assets/bulk', { assets });
