import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getServices = () => api.get('/services');
export const getService = (id) => api.get(`/services/${id}`);
export const createService = (data) => api.post('/services', data);
export const getDashboardSummary = () =>
  api.get("/dashboard/summary");
export const getIncidents = () =>
  api.get("/incidents");
export const getAlerts = () => api.get("/alerts");
export const acknowledgeAlert = (id) => api.post(`/alerts/${id}/acknowledge`);
export const getMetrics = (id) => api.get(`/metrics/${id}`);
export const resetData = () => api.post('/services/reset');
export const deleteService = (id) => api.delete(`/services/${id}`);
export const getServiceIncidents = (id) => api.get(`/services/${id}/incidents`);

export default api;
