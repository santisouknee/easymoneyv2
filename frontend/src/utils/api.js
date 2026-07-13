const API_BASE = 'http://localhost:5000/api';

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
}

export function getCurrentUser() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function setCurrentUser(user) {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }
}

export function logout() {
  setAuthToken(null);
  setCurrentUser(null);
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (response.status === 401) {
      // Auto logout on unauthorized
      logout();
      return { error: 'Unauthorized' };
    }

    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Something went wrong' };
    }
    
    return data;
  } catch (err) {
    console.error(`API Request to ${endpoint} failed:`, err);
    return { error: 'Network connection failed' };
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
