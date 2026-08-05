/**
 * Environment Configuration
 * Loaded before api.js to set the correct API base URL.
 */

const getApiBaseUrl = () => {
  const host = window.location.hostname;

  // Local development
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8080';
  }

  // Production — Render backend
  return 'https://portfolio-backend-pm6w.onrender.com';
};

window.API_BASE_URL = getApiBaseUrl();
