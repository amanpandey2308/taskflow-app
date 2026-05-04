const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
});

const request = async (method, path, body = null) => {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const api = {
  // Auth
  signup: (body) => request('POST', '/auth/signup', body),
  login: (body) => request('POST', '/auth/login', body),
  getMe: () => request('GET', '/auth/me'),

  // Projects
  getProjects: () => request('GET', '/projects'),
  createProject: (body) => request('POST', '/projects', body),
  getProject: (id) => request('GET', `/projects/${id}`),
  deleteProject: (id) => request('DELETE', `/projects/${id}`),
  addMember: (id, body) => request('POST', `/projects/${id}/members`, body),
  removeMember: (id, userId) => request('DELETE', `/projects/${id}/members/${userId}`),

  // Tasks
  getProjectTasks: (projectId, query = '') => request('GET', `/projects/${projectId}/tasks${query}`),
  createTask: (projectId, body) => request('POST', `/projects/${projectId}/tasks`, body),
  updateTask: (id, body) => request('PATCH', `/tasks/${id}`, body),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),

  // Dashboard
  getDashboard: () => request('GET', '/dashboard'),
};

// Toast notifications
const showToast = (message, type = 'info') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
};

// Auth guard
const requireAuth = () => {
  if (!getToken()) { window.location.href = 'index.html'; return false; }
  return true;
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};
