import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "");

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getServices = () => api.get('/services');
export const getService = (id) => api.get(`/services/${id}`);
export const createService = (data) => api.post('/services', data);
export const getDashboardSummary = () =>
  api.get("/dashboard/summary");
export const getIncidents = () => api.get("/incidents");
export const getIncident = (id) => api.get(`/incidents/${id}`);
export const getIncidentEvents = (id) => api.get(`/incidents/${id}/events`);
export const acknowledgeIncident = (id, acknowledgedBy = "Lead SRE") =>
  api.post(`/incidents/${id}/acknowledge`, { acknowledged_by: acknowledgedBy });
export const resolveIncident = (id, resolvedBy = "Lead SRE") =>
  api.post(`/incidents/${id}/resolve`, { resolved_by: resolvedBy });
export const getIncidentMetrics = () => api.get("/incidents/metrics");

export const getAlerts = () => api.get("/alerts");
export const acknowledgeAlert = (id) => api.post(`/alerts/${id}/acknowledge`);
export const getMetrics = (id) => api.get(`/metrics/${id}`);
export const resetData = () => api.post('/services/reset');
export const deleteService = (id) => api.delete(`/services/${id}`);
export const getServiceIncidents = (id) => api.get(`/services/${id}/incidents`);

// Deployments
export const getDeployments = (params = {}) => api.get("/deployments", { params });
export const getDeployment = (id) => api.get(`/deployments/${id}`);
export const getDeploymentEvents = (id) => api.get(`/deployments/${id}/events`);
export const createDeployment = (data) => api.post("/deployments", data);
export const rollbackDeployment = (id, data = {}) => api.post(`/deployments/${id}/rollback`, data);
export const getDeploymentMetrics = () => api.get("/deployments/metrics");

// Kubernetes
export const getK8sOverview = () => api.get("/kubernetes/overview");
export const getK8sNodes = () => api.get("/kubernetes/nodes");
export const getK8sPods = (params = {}) => api.get("/kubernetes/pods", { params });
export const getK8sPod = (name) => api.get(`/kubernetes/pods/${name}`);
export const getK8sDeployments = (params = {}) => api.get("/kubernetes/deployments", { params });
export const getK8sServices = (params = {}) => api.get("/kubernetes/services", { params });
export const getK8sHPA = () => api.get("/kubernetes/hpa");
export const getK8sEvents = () => api.get("/kubernetes/events");
export const simulatePodState = (name, status) => api.post(`/kubernetes/pods/${name}/simulate`, { status });

// Projects & Workspaces
export const getProjects = () => api.get("/projects");
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post("/projects", data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const testProjectWebhook = (data) => api.post("/projects/test-webhook", data);

// User Alert Rules
export const getAlertRules = (params = {}) => api.get("/alert-rules", { params });
export const createAlertRule = (data) => api.post("/alert-rules", data);
export const updateAlertRule = (id, data) => api.put(`/alert-rules/${id}`, data);
export const deleteAlertRule = (id) => api.delete(`/alert-rules/${id}`);
export const toggleAlertRule = (id) => api.patch(`/alert-rules/${id}/toggle`);

export const testProbeService = (data) => api.post("/services/test-probe", data);

export default api;


