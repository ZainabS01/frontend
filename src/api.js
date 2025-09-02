export const API_BASE = import.meta.env.VITE_API_BASE || 'https://studentattendence23.netlify.app/.netlify/functions/api';

export function apiFetch(path, options) {
  const url = `${API_BASE}${path}`;
  return fetch(url, options);
}


