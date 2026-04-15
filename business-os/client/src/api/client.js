import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 → logout + redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth endpoints
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Leads / CRM endpoints
export const leadsApi = {
  getAll: (params) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  move: (id, stage) => api.put(`/leads/${id}/move`, { stage }),
  delete: (id) => api.delete(`/leads/${id}`),
  addNote: (id, content) => api.post(`/leads/${id}/notes`, { content }),
  getNotes: (id) => api.get(`/leads/${id}/notes`),
  getActivity: (id) => api.get(`/leads/${id}/activity`),
  logCall: (id, data) => api.post(`/leads/${id}/calls`, data),
  scheduleFollowUp: (id, data) => api.post(`/leads/${id}/followups`, data),
};

// Sales endpoints
export const salesApi = {
  getDashboard: (params) => api.get('/sales/dashboard', { params }),
  getLeaderboard: (params) => api.get('/sales/leaderboard', { params }),
  getActivity: (params) => api.get('/sales/activity', { params }),
};

// Marketing endpoints
export const marketingApi = {
  getContent: (params) => api.get('/marketing/content', { params }),
  createContent: (data) => api.post('/marketing/content', data),
  updateContent: (id, data) => api.put(`/marketing/content/${id}`, data),
  deleteContent: (id) => api.delete(`/marketing/content/${id}`),
  getCampaigns: (params) => api.get('/marketing/campaigns', { params }),
  createCampaign: (data) => api.post('/marketing/campaigns', data),
  updateCampaign: (id, data) => api.put(`/marketing/campaigns/${id}`, data),
  getTrafficSources: () => api.get('/marketing/traffic-sources'),
};

// Clients / Fulfillment endpoints
export const clientsApi = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  update: (id, data) => api.put(`/clients/${id}`, data),
  getChecklist: (id) => api.get(`/clients/${id}/checklist`),
  updateChecklistItem: (id, itemId, data) =>
    api.put(`/clients/${id}/checklist/${itemId}`, data),
  addChecklistItem: (id, data) => api.post(`/clients/${id}/checklist`, data),
  getDeliverables: (id) => api.get(`/clients/${id}/deliverables`),
  addDeliverable: (id, data) => api.post(`/clients/${id}/deliverables`, data),
  updateDeliverable: (id, deliverableId, data) =>
    api.put(`/clients/${id}/deliverables/${deliverableId}`, data),
  getNotes: (id) => api.get(`/clients/${id}/notes`),
  addNote: (id, content) => api.post(`/clients/${id}/notes`, { content }),
};

// Resources endpoints
export const resourcesApi = {
  getAll: (params) => api.get('/resources', { params }),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
};

// Team / Settings endpoints
export const settingsApi = {
  getTeam: () => api.get('/settings/team'),
  inviteTeamMember: (data) => api.post('/settings/team/invite', data),
  updateTeamMember: (id, data) => api.put(`/settings/team/${id}`, data),
  removeTeamMember: (id) => api.delete(`/settings/team/${id}`),
  getApiKeys: () => api.get('/settings/api-keys'),
  createApiKey: (data) => api.post('/settings/api-keys', data),
  deleteApiKey: (id) => api.delete(`/settings/api-keys/${id}`),
  getNotifications: () => api.get('/settings/notifications'),
  updateNotifications: (data) => api.put('/settings/notifications', data),
  getGeneral: () => api.get('/settings/general'),
  updateGeneral: (data) => api.put('/settings/general', data),
};

// Dashboard endpoints
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/activity'),
  getUpcomingCalls: () => api.get('/dashboard/upcoming-calls'),
  getPipelineOverview: () => api.get('/dashboard/pipeline-overview'),
};
