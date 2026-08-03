/**
 * Portfolio CMS — API Client
 * Centralized fetch wrapper for all API calls
 */

// Use environment-specific API URL (set in env-config.js)
const API_BASE = window.API_BASE_URL || 'http://localhost:8080';

const api = {
  /** Get stored JWT token */
  getToken() {
    return localStorage.getItem('portfolio_token');
  },

  /** Build headers, optionally with Auth */
  headers(auth = false) {
    const h = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = this.getToken();
      if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  },

  /** Parse response — always returns JSON, even on error status codes */
  async _parse(res) {
    const text = await res.text();
    if (!text) return { success: false, message: `Server error (${res.status})` };
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: text || `Server error (${res.status})` };
    }
  },

  /** Generic GET */
  async get(path, auth = false) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: this.headers(auth),
    });
    return this._parse(res);
  },

  /** Generic POST */
  async post(path, body, auth = false) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this.headers(auth),
      body: JSON.stringify(body),
    });
    return this._parse(res);
  },

  /** Generic PUT */
  async put(path, body, auth = false) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: this.headers(auth),
      body: JSON.stringify(body),
    });
    return this._parse(res);
  },

  /** Generic DELETE */
  async del(path, auth = false) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: this.headers(auth),
    });
    return this._parse(res);
  },

  /** Multipart form upload */
  async upload(path, formData, auth = true) {
    const headers = {};
    if (auth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return this._parse(res);
  },

  /* ── Public Endpoints ── */
  profile: () => api.get('/api/public/profile'),
  skills: () => api.get('/api/public/skills'),
  projects: (search) => api.get(`/api/public/projects${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  projectById: (id) => api.get(`/api/public/projects/${id}`),
  certificates: () => api.get('/api/public/certifications'),
  education: () => api.get('/api/public/education'),
  experience: () => api.get('/api/public/experience'),
  achievements: () => api.get('/api/public/achievements'),
  settings: () => api.get('/api/public/settings'),
  contact: (data) => api.post('/api/public/messages', data),

  /* ── Auth ── */
  login: (data) => api.post('/api/auth/login', data),

  /* ── Admin ── */
  admin: {
    // Dashboard
    stats: () => api.get('/api/admin/dashboard/stats', true),

    // Profile
    updateProfile: (data) => api.put('/api/admin/profile', data, true),

    // Skills
    createSkill: (data) => api.post('/api/admin/skills', data, true),
    updateSkill: (id, data) => api.put(`/api/admin/skills/${id}`, data, true),
    deleteSkill: (id) => api.del(`/api/admin/skills/${id}`, true),

    // Projects
    createProject: (data) => api.post('/api/admin/projects', data, true),
    updateProject: (id, data) => api.put(`/api/admin/projects/${id}`, data, true),
    deleteProject: (id) => api.del(`/api/admin/projects/${id}`, true),

    // Certificates
    createCert: (data) => api.post('/api/admin/certificates', data, true),
    updateCert: (id, data) => api.put(`/api/admin/certificates/${id}`, data, true),
    deleteCert: (id) => api.del(`/api/admin/certificates/${id}`, true),

    // Education
    createEducation: (data) => api.post('/api/admin/education', data, true),
    updateEducation: (id, data) => api.put(`/api/admin/education/${id}`, data, true),
    deleteEducation: (id) => api.del(`/api/admin/education/${id}`, true),

    // Experience
    createExperience: (data) => api.post('/api/admin/experience', data, true),
    updateExperience: (id, data) => api.put(`/api/admin/experience/${id}`, data, true),
    deleteExperience: (id) => api.del(`/api/admin/experience/${id}`, true),

    // Achievements
    createAchievement: (data) => api.post('/api/admin/achievements', data, true),
    updateAchievement: (id, data) => api.put(`/api/admin/achievements/${id}`, data, true),
    deleteAchievement: (id) => api.del(`/api/admin/achievements/${id}`, true),

    // Messages
    messages: () => api.get('/api/admin/messages', true),
    archivedMessages: () => api.get('/api/admin/messages/archived', true),
    markRead: (id) => api.put(`/api/admin/messages/${id}/read`, {}, true),
    archiveMessage: (id) => api.put(`/api/admin/messages/${id}/archive`, {}, true),
    deleteMessage: (id) => api.del(`/api/admin/messages/${id}`, true),

    // Resume
    resumeInfo: () => api.get('/api/admin/resume', true),
    allResumes: () => api.get('/api/admin/resume/all', true),
    activateResume: (id) => api.put(`/api/admin/resume/${id}/activate`, {}, true),

    // Media
    media: (cat) => api.get(`/api/admin/media${cat ? `?category=${cat}` : ''}`, true),
    deleteMedia: (id) => api.del(`/api/admin/media/${id}`, true),

    // Settings
    updateSettings: (data) => api.put('/api/admin/settings', data, true),
  },
};
