export const API_BASE = import.meta.env.VITE_API_BASE || 'https://backend-omega-teal.vercel.app/api';

export function apiFetch(path, options) {
  const url = `${API_BASE}${path}`;
  return fetch(url, options);
}


