export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export function apiFetch(path, options) {
  const url = `${API_BASE}${path}`;
  return fetch(url, options);
}


