import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: false, // JWT via header, not cookie (avoid CSRF surface)
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF indicator
  },
});

// Attach token on every request
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('vg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('vg_token');
      // Emit custom event so AuthContext can react without circular imports
      window.dispatchEvent(new CustomEvent('vg:unauthorized'));
    }
    return Promise.reject(err);
  }
);

// API helpers
export const vegetableApi = {
  list:    (params) => api.get('/vegetables', { params }),
  get:     (id)    => api.get(`/vegetables/${id}`),
  create:  (data)  => api.post('/vegetables', data),
  update:  (id, d) => api.put(`/vegetables/${id}`, d),
  delete:  (id)    => api.delete(`/vegetables/${id}`),
  categories: ()   => api.get('/vegetables/categories'),
};

export const orderApi = {
  place:   (data) => api.post('/orders', data),
  list:    ()     => api.get('/orders'),
  get:     (id)   => api.get(`/orders/${id}`),
  cancel:  (id)   => api.post(`/orders/${id}/cancel`),
  // Admin
  all:     (p)    => api.get('/admin/orders', { params: p }),
  status:  (id,s) => api.put(`/admin/orders/${id}/status`, { status: s }),
};

export const adminApi = {
  stats:   () => api.get('/admin/stats'),
  users:   (p) => api.get('/admin/users', { params: p }),
};

export default api;
