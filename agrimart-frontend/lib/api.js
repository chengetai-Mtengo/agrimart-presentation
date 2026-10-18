const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://online-agriculture-market-place.onrender.com';
const TOKEN_KEY = 'agrimart_token';

// Product/profile images come back from the backend two ways:
//  - a full Supabase Storage URL (already absolute — used as-is)
//  - a relative local-disk path like "/uploads/products/xyz.jpg" (when
//    Supabase isn't configured on the backend, see storage.js) — this needs
//    the API host prefixed or the browser will try to load it from the
//    frontend's own origin and 404.
export function resolveImageUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_URL}${path}`;
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function qs(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries).toString()}`;
}

async function request(path, { method = 'GET', body, auth = false, isForm = false } = {}) {
  const headers = {};
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Could not reach the AgriMart backend at ${API_URL}. Is it running?`
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  // Marketplace catalogue
  listCategories: () => request('/api/categories'),

  // Auth
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me', { auth: true }),

  // Users
  listUsers: () => request('/api/users'),
  getUser: (id) => request(`/api/users/${id}`),
  updateProfile: (payload) =>
    request('/api/users/profile', { method: 'PUT', body: payload, auth: true }),
  changePassword: (payload) =>
    request('/api/users/change-password', { method: 'POST', body: payload, auth: true }),
  updateLocation: (payload) =>
    request('/api/users/location', { method: 'PUT', body: payload, auth: true }),
  uploadProfilePicture: (formData) =>
    request('/api/users/profile-picture', {
      method: 'POST',
      body: formData,
      auth: true,
      isForm: true,
    }),

  // Products
  listProducts: (params) => request(`/api/products${qs(params)}`),
  getProduct: (id) => request(`/api/products/${id}`),
  createProduct: (formData) =>
    request('/api/products', { method: 'POST', body: formData, auth: true, isForm: true }),
  updateProduct: (id, formData) =>
    request(`/api/products/${id}`, { method: 'PUT', body: formData, auth: true, isForm: true }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE', auth: true }),
  markSoldOut: (id) => request(`/api/products/${id}/mark-sold-out`, { method: 'POST', auth: true }),
  compareProduct: (productId) => request(`/api/products/compare${qs({ productId })}`),

  // Saved products
  listSaved: () => request('/api/saved', { auth: true }),
  toggleSaved: (productId) => request(`/api/saved/${productId}`, { method: 'POST', auth: true }),
  removeSaved: (productId) => request(`/api/saved/${productId}`, { method: 'DELETE', auth: true }),

  // Notifications
  getNotifications: () => request('/api/notifications', { auth: true }),
  updateNotifications: (payload) =>
    request('/api/notifications', { method: 'PUT', body: payload, auth: true }),

  // Health
  health: () => request('/api/health'),
};
