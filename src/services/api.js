import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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

// ── Assets ──
export const getAssets = (page = 1, limit = 10, search = '', type = '', status = '', availableOnly = false) => 
  api.get('/assets', { params: { page, limit, search, type, status, availableOnly } });
export const getAsset = (id) => api.get(`/assets/${id}`);
export const createAsset = (data) => api.post('/assets', data);
export const updateAsset = (id, data) => api.put(`/assets/${id}`, data);
export const deleteAsset = (id) => api.delete(`/assets/${id}`);
export const getAssetHistory = (assetId) => api.get(`/assets/history/${assetId}`);
export const getSetHistory = (setId) => api.get(`/assets/history/set/${setId}`);

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
export const disassembleContainer = (setId) => api.delete(`/containers/${setId}`);

// ── Challan (DC) ──
export const createChallan = (data) => api.post('/challans', data);
export const getAllChallans = () => api.get('/challans');
export const getChallanById = (id) => api.get(`/challans/${id}`);