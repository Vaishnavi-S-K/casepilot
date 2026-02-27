import axios from 'axios';
import { getSession } from '../utils/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach user info to every request
api.interceptors.request.use((config) => {
  const session = getSession();
  if (session) {
    config.headers['x-user-name'] = session.name || '';
    config.headers['x-user-email'] = session.email || '';
  }
  return config;
});

// ─── API helpers ───
function makeCRUD(base) {
  return {
    getAll: (params) => api.get(base, { params }).then((r) => r.data),
    getOne: (id) => api.get(`${base}/${id}`).then((r) => r.data),
    create: (data) => api.post(base, data).then((r) => r.data),
    update: (id, data) => api.put(`${base}/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`${base}/${id}`).then((r) => r.data),
  };
}

export const casesAPI = makeCRUD('/cases');
export const clientsAPI = makeCRUD('/clients');
export const documentsAPI = makeCRUD('/documents');
export const tasksAPI = makeCRUD('/tasks');

export const notificationsAPI = {
  ...makeCRUD('/notifications'),
  readAll: () => api.put('/notifications/read-all').then((r) => r.data),
  markRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  clearAll: () => api.delete('/notifications').then((r) => r.data),
};

export const statsAPI = {
  get: () => api.get('/stats').then((r) => r.data),
  insights: (params) => api.get('/stats/insights', { params }).then((r) => r.data),
};

export const searchAPI = {
  query: (q) => api.get('/search', { params: { q } }).then((r) => r.data),
};

export const calendarAPI = {
  get: (year, month) => api.get('/calendar', { params: { year, month } }).then((r) => r.data),
};

export const uploadAPI = {
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export const seedAPI = {
  run: () => api.get('/seed').then((r) => r.data),
};

export default api;
