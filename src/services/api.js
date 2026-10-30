import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// ── Assets ──
export const getAssets = () => axios.get(`${API_URL}/assets`);
export const getAsset = (id) => axios.get(`${API_URL}/assets/${id}`);
export const createAsset = (data) => axios.post(`${API_URL}/assets`, data);
export const updateAsset = (id, data) => axios.put(`${API_URL}/assets/${id}`, data);
export const deleteAsset = (id) => axios.delete(`${API_URL}/assets/${id}`);

// ── Locations ──
export const getLocations = () => axios.get(`${API_URL}/locations`);
export const createLocation = (data) => axios.post(`${API_URL}/locations`, data);
export const updateLocation = (id, data) => axios.put(`${API_URL}/locations/${id}`, data);
export const deleteLocation = (id) => axios.delete(`${API_URL}/locations/${id}`);

// ── Scanning ──
export const dispatchScan = (data) => axios.post(`${API_URL}/scan/dispatch`, data);

// ── Exceptions / Containers ──
export const getExceptions = () => axios.get(`${API_URL}/assets/exceptions`);
export const getContainers = () => axios.get(`${API_URL}/assets/containers`);