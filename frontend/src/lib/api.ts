import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const createClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor: attach JWT token
  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('secops_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Response interceptor: handle 401
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('secops_token');
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const api = createClient();

// ─── Auth ──────────────────────────────────────────────────
export const authApi = {
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ─── GitHub ────────────────────────────────────────────────
export const githubApi = {
  listRepos: () => api.get('/github/repos'),
  toggleScanning: (repoId: number, data: object) =>
    api.post(`/github/repos/${repoId}/toggle`, data),
};

// ─── Scanner ───────────────────────────────────────────────
export const scannerApi = {
  triggerScan: (repositoryId: string) => api.post('/scans/trigger', { repositoryId }),
  getScan: (scanId: string) => api.get(`/scans/${scanId}`),
  getLatestScanByFullName: (owner: string, repo: string) =>
    api.get(`/scans/repository/by-fullname/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`),
  getRepositoryScans: (repositoryId: string, page = 1) =>
    api.get(`/scans/repository/${repositoryId}`, { params: { page } }),
  getVulnerabilities: (scanId: string, severity?: string) =>
    api.get(`/scans/${scanId}/vulnerabilities`, { params: { severity } }),
  getDashboardSummary: () => api.get('/scans/dashboard/summary'),
};

// ─── AI / Demo ─────────────────────────────────────────────
export const aiApi = {
  analyzeDemo: (code: string) => api.post('/ai/demo/analyze', { code }),
};

// ─── PR ────────────────────────────────────────────────────
export const prApi = {
  getRepositoryPRs: (repositoryId: string) =>
    api.get(`/pr/repository/${repositoryId}`),
};

// ─── Live Scan ─────────────────────────────────────────────
export const liveScanApi = {
  scan: (url: string, domainVerified: boolean) =>
    api.post('/live-scan/scan', { url, domainVerified }),
};

// ─── Teams ─────────────────────────────────────────────────
export const teamApi = {
  createTeam: (name: string) => api.post('/teams', { name }),
  getMyTeams: () => api.get('/teams/mine'),
  inviteMember: (teamId: string, userId: string, role: string) =>
    api.post(`/teams/${teamId}/invite`, { userId, role }),
  getMembers: (teamId: string) => api.get(`/teams/${teamId}/members`),
  getActivity: (teamId: string) => api.get(`/teams/${teamId}/activity`),
  updateRole: (teamId: string, memberId: string, role: string) =>
    api.patch(`/teams/${teamId}/members/${memberId}/role`, { role }),
};

// ─── Trends ────────────────────────────────────────────────
export const trendsApi = {
  getRepositoryTrends: (repositoryId: string) =>
    api.get(`/trends/repository/${repositoryId}`),
  getGlobalTrends: () => api.get('/trends/global'),
};
