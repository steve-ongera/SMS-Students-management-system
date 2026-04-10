// ═══════════════════════════════════════════════════
// services/api.js  —  Centralised API layer
// All calls go through this module; JWT is injected
// automatically from localStorage.
// ═══════════════════════════════════════════════════

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ── Token helpers ──────────────────────────────────
export const getToken    = () => localStorage.getItem('access_token');
export const getRefresh  = () => localStorage.getItem('refresh_token');
export const setTokens   = (access, refresh) => {
  localStorage.setItem('access_token',  access);
  localStorage.setItem('refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// ── Core fetch wrapper ─────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Don't set Content-Type for FormData (multipart)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Token expired → try refresh
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.Authorization = `Bearer ${getToken()}`;
      const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      return handleResponse(retry);
    } else {
      clearTokens();
      window.location.href = '/';
      return;
    }
  }

  return handleResponse(res);
}

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || data.message || JSON.stringify(data) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function tryRefresh() {
  const refresh = getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access, refresh);
    return true;
  } catch {
    return false;
  }
}

// ── HTTP verbs ─────────────────────────────────────
const api = {
  get:    (path, params)  => request(path + (params ? '?' + new URLSearchParams(params) : '')),
  post:   (path, body)    => request(path, { method: 'POST',  body: body instanceof FormData ? body : JSON.stringify(body) }),
  put:    (path, body)    => request(path, { method: 'PUT',   body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch:  (path, body)    => request(path, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: (path)          => request(path, { method: 'DELETE' }),
};

// ══════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════
export const authAPI = {
  login:   (credentials) => api.post('/auth/login/', credentials),
  logout:  (refresh)     => api.post('/auth/logout/', { refresh }),
  me:      ()            => api.get('/auth/me/'),
};

// ══════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════
export const dashboardAPI = {
  stats: () => api.get('/dashboard/'),
};

// ══════════════════════════════════════════════════
//  PROGRAMMES
// ══════════════════════════════════════════════════
export const programmesAPI = {
  list:    (params) => api.get('/programmes/', params),
  get:     (id)     => api.get(`/programmes/${id}/`),
  create:  (data)   => api.post('/programmes/', data),
  update:  (id, d)  => api.put(`/programmes/${id}/`, d),
  patch:   (id, d)  => api.patch(`/programmes/${id}/`, d),
  delete:  (id)     => api.delete(`/programmes/${id}/`),
  courses: (id)     => api.get(`/programmes/${id}/courses/`),
  students:(id)     => api.get(`/programmes/${id}/students/`),
};

// ══════════════════════════════════════════════════
//  COURSES
// ══════════════════════════════════════════════════
export const coursesAPI = {
  list:   (params) => api.get('/courses/', params),
  get:    (id)     => api.get(`/courses/${id}/`),
  create: (data)   => api.post('/courses/', data),
  update: (id, d)  => api.put(`/courses/${id}/`, d),
  patch:  (id, d)  => api.patch(`/courses/${id}/`, d),
  delete: (id)     => api.delete(`/courses/${id}/`),
};

// ══════════════════════════════════════════════════
//  STUDENTS
// ══════════════════════════════════════════════════
export const studentsAPI = {
  list:       (params) => api.get('/students/', params),
  get:        (id)     => api.get(`/students/${id}/`),
  create:     (data)   => api.post('/students/', data),   // data can be FormData
  update:     (id, d)  => api.put(`/students/${id}/`, d),
  patch:      (id, d)  => api.patch(`/students/${id}/`, d),
  delete:     (id)     => api.delete(`/students/${id}/`),
  results:    (id)     => api.get(`/students/${id}/results/`),
  enrollments:(id)     => api.get(`/students/${id}/enrollments/`),
};

// ══════════════════════════════════════════════════
//  ENROLLMENTS
// ══════════════════════════════════════════════════
export const enrollmentsAPI = {
  list:   (params) => api.get('/enrollments/', params),
  create: (data)   => api.post('/enrollments/', data),
  delete: (id)     => api.delete(`/enrollments/${id}/`),
};

// ══════════════════════════════════════════════════
//  EXAMS
// ══════════════════════════════════════════════════
export const examsAPI = {
  list:    (params) => api.get('/exams/', params),
  get:     (id)     => api.get(`/exams/${id}/`),
  create:  (data)   => api.post('/exams/', data),
  update:  (id, d)  => api.put(`/exams/${id}/`, d),
  patch:   (id, d)  => api.patch(`/exams/${id}/`, d),
  delete:  (id)     => api.delete(`/exams/${id}/`),
  results: (id)     => api.get(`/exams/${id}/results/`),
  addResult: (id, d) => api.post(`/exams/${id}/results/`, d),
};

// ══════════════════════════════════════════════════
//  EXAM RESULTS
// ══════════════════════════════════════════════════
export const resultsAPI = {
  list:   (params) => api.get('/results/', params),
  get:    (id)     => api.get(`/results/${id}/`),
  create: (data)   => api.post('/results/', data),
  update: (id, d)  => api.put(`/results/${id}/`, d),
  patch:  (id, d)  => api.patch(`/results/${id}/`, d),
  delete: (id)     => api.delete(`/results/${id}/`),
};

// ══════════════════════════════════════════════════
//  USERS (admin management)
// ══════════════════════════════════════════════════
export const usersAPI = {
  list:         (params) => api.get('/users/', params),
  get:          (id)     => api.get(`/users/${id}/`),
  create:       (data)   => api.post('/users/', data),
  update:       (id, d)  => api.put(`/users/${id}/`, d),
  patch:        (id, d)  => api.patch(`/users/${id}/`, d),
  delete:       (id)     => api.delete(`/users/${id}/`),
  setPassword:  (id, pw) => api.patch(`/users/${id}/set_password/`, { password: pw }),
  toggleActive: (id)     => api.patch(`/users/${id}/toggle_active/`),
};

export default api;